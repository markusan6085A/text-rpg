import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { processFishDrop, buildItemsFromDrop } from "../../../fishDismantle";
import { getAuth } from "../auth";
import { addVersioning } from "../../../heroJsonValidator";
import { EXP_TABLE, MAX_LEVEL } from "../../../expTable";

function getExpToNext(level: number): number {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
  if (lvl >= MAX_LEVEL) return 0;
  return Math.max(0, Number(EXP_TABLE[lvl] ?? 0) - Number(EXP_TABLE[lvl - 1] ?? 0));
}

function normalizeExpToLevelProgress(rawExp: unknown, levelRaw: unknown): number {
  const levelNum = Math.max(1, Math.min(MAX_LEVEL, Number(levelRaw) || 1));
  const need = Math.max(0, Number(getExpToNext(levelNum)) || 0);
  let exp = Math.max(0, Number(rawExp) || 0);

  if (need <= 0 || levelNum >= MAX_LEVEL) return 0;
  return Math.max(0, exp);
}

export async function characterFishingRoutes(app: FastifyInstance) {
  // --- Fishing ---
  const FISHING_COST_SP = 5000;
  const FISHING_COST_ADENA = 5_000_000;
  const FISHING_DURATION_MS = 60 * 60 * 1000;
  const ROD_ITEM_ID = "baby_duck_rod";
  const BAIT_ITEM_ID = "gludio_fish_lure";
  const FISH_ITEM_ID = "fish_seawater";
  // Залежність улову від заточки удочки (+0..+1000)
  const FISH_BY_ROD_ENCHANT: Array<{ min: number; max: number }> = [
    { min: 100, max: 300 },   // +0
    { min: 110, max: 300 },   // +100
    { min: 120, max: 300 },   // +200
    { min: 130, max: 310 },   // +300
    { min: 130, max: 320 },   // +400
    { min: 130, max: 330 },   // +500
    { min: 140, max: 350 },   // +600
    { min: 140, max: 360 },   // +700
    { min: 150, max: 370 },   // +800
    { min: 150, max: 380 },   // +900
    { min: 160, max: 400 },   // +1000
  ];
  function getFishRangeByRodEnchant(enchant: number): { min: number; max: number } {
    const idx = Math.min(10, Math.floor(Math.max(0, enchant) / 100));
    return FISH_BY_ROD_ENCHANT[idx];
  }

  app.get("/characters/:id/fishing", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const ch = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });
      const heroJson = (ch.heroJson ?? {}) as any;
      const session = heroJson.fishingSession ?? null;
      return reply.send({ ok: true, session, serverNow: Date.now() });
    } catch (error) {
      app.log.error(error, "GET /characters/:id/fishing");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  app.post("/characters/:id/fishing/start", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const owner = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true },
      });
      if (!owner) return reply.code(404).send({ error: "character not found" });

      const updated = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${owner.id} FOR UPDATE`;

        const ch = await tx.character.findUnique({
          where: { id: owner.id },
          select: { id: true, sp: true, adena: true, heroJson: true },
        });
        if (!ch) throw new Error("character not found");

        const heroJson = (ch.heroJson ?? {}) as any;
        if (heroJson.fishingSession) throw new Error("fishing already in progress");

        const equipment = heroJson.equipment ?? {};
        const encLevels = heroJson.equipmentEnchantLevels ?? {};
        const isRod = (id: string | null | undefined) => id === "baby_duck_rod" || id === "shop_baby_duck_rod" || (id && id.toLowerCase().includes("rod"));
        const rodSlot =
          isRod(equipment["weapon"]) ? "weapon" :
          isRod(equipment["lrhand"]) ? "lrhand" :
          isRod(equipment["shield"]) ? "shield" : null;
        if (!rodSlot) throw new Error("rod required (Baby Duck Rod)");
        const rodEnchant = Number(encLevels[rodSlot]) || 0;

        const inv: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
        const baitIdx = inv.findIndex((i: any) => {
          const id = i?.id ?? i?.itemId;
          return (id === "gludio_fish_lure" || id === "shop_gludio_fish_lure") && (Number(i?.count) ?? 0) > 0;
        });
        if (baitIdx < 0) throw new Error("bait required (Gludio Fish Lure)");

        const sp = Number(ch.sp) ?? 0;
        const adena = Number(ch.adena) ?? 0;
        if (sp < FISHING_COST_SP || adena < FISHING_COST_ADENA) {
          throw new Error(`need ${FISHING_COST_SP} SP and ${FISHING_COST_ADENA} adena`);
        }

        const newInv = inv
          .map((item: any, idx: number) => {
            if (idx !== baitIdx) return item;
            const c = Math.max(0, (Number(item.count) ?? 1) - 1);
            return c > 0 ? { ...item, count: c } : null;
          })
          .filter(Boolean) as any[];

        const { min: fishMin, max: fishMax } = getFishRangeByRodEnchant(rodEnchant);
        const fishCount = fishMin + Math.floor(Math.random() * (fishMax - fishMin + 1));
        const oldRevision = heroJson.heroRevision ?? 0;
        const updatedHeroJson = addVersioning(
          {
            ...heroJson,
            inventory: newInv,
            fishingSession: { startedAt: Date.now(), fishCount },
          },
          oldRevision
        );

        return tx.character.update({
          where: { id: ch.id },
          data: {
            sp: { decrement: FISHING_COST_SP },
            adena: { decrement: FISHING_COST_ADENA },
            heroJson: updatedHeroJson,
            lastActivityAt: new Date(),
          },
          select: {
            id: true, name: true, race: true, classId: true, sex: true, level: true,
            exp: true, sp: true, adena: true, aa: true, coinLuck: true, heroJson: true, updatedAt: true,
          },
        });
      });

      const fs = (updated.heroJson as any).fishingSession;
      const session = { startedAt: fs?.startedAt ?? Date.now(), fishCount: fs?.fishCount };
      return reply.send({
        ok: true,
        character: { ...updated, exp: Number(updated.exp) },
        session,
        serverNow: Date.now(),
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg === "character not found" ||
          msg === "fishing already in progress" ||
          msg === "rod required (Baby Duck Rod)" ||
          msg === "bait required (Gludio Fish Lure)" ||
          msg.startsWith("need ")
        ) {
          const code = msg === "character not found" ? 404 : 400;
          return reply.code(code).send({ error: msg });
        }
      }
      app.log.error(error, "POST /characters/:id/fishing/start");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  app.post("/characters/:id/fishing/collect", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const owner = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true },
      });
      if (!owner) return reply.code(404).send({ error: "character not found" });

      const { updated, fishCount, expGained } = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${owner.id} FOR UPDATE`;

        const ch = await tx.character.findUnique({
          where: { id: owner.id },
          select: { id: true, heroJson: true, level: true, exp: true },
        });
        if (!ch) throw new Error("character not found");

        const heroJson = (ch.heroJson ?? {}) as any;
        const session = heroJson.fishingSession;
        if (!session || typeof session.startedAt !== "number") {
          throw new Error("no active fishing session");
        }

        const elapsed = Date.now() - session.startedAt;
        if (elapsed < FISHING_DURATION_MS) {
          throw new Error("fishing not ready yet (1 hour required)");
        }

        const fishCount = Number(session.fishCount) > 0 ? Number(session.fishCount) : 0;
        if (fishCount <= 0) throw new Error("invalid fishing reward");

        let expGained = 0;
        const r = Math.random();
        if (r < 0.20) {
          expGained = 600000 + Math.floor(Math.random() * 400001); // 600,000 - 1,000,000
        } else if (r < 0.60) {
          expGained = 400000 + Math.floor(Math.random() * 200001); // 400,000 - 600,000
        } else {
          expGained = 100000 + Math.floor(Math.random() * 300001); // 100,000 - 400,000
        }

        let nextLevel = Math.max(1, Math.min(MAX_LEVEL, Number(ch.level) || 1));
        let nextExp = normalizeExpToLevelProgress(ch.exp, nextLevel) + expGained;
        while (nextLevel < MAX_LEVEL) {
          const need = getExpToNext(nextLevel);
          if (need <= 0 || nextExp < need) break;
          nextExp -= need;
          nextLevel += 1;
        }
        if (nextLevel >= MAX_LEVEL) nextExp = 0;

        const inv: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
        const existing = inv.find((i: any) => (i?.id ?? i?.itemId) === FISH_ITEM_ID);
        if (existing) {
          existing.count = (Number(existing.count) ?? 0) + fishCount;
        } else {
          inv.push({
            id: FISH_ITEM_ID,
            name: "fish_seawater",
            icon: "/items/drops/resources/Etc_fish_seawater_i01_0.jpg",
            slot: "resource",
            count: fishCount,
          });
        }

        const { fishingSession: _, ...restHero } = heroJson;
        const prevTotal = Number(restHero.fishCaughtTotal ?? 0) || 0;
        const oldRevision = heroJson.heroRevision ?? 0;
        const updatedHeroJson = addVersioning(
          { ...restHero, inventory: inv, fishCaughtTotal: prevTotal + fishCount },
          oldRevision
        );

        const updated = await tx.character.update({
          where: { id: ch.id },
          data: {
            level: nextLevel,
            exp: Math.max(0, Math.floor(nextExp)),
            heroJson: updatedHeroJson,
            lastActivityAt: new Date(),
          },
          select: {
            id: true, name: true, race: true, classId: true, sex: true, level: true,
            exp: true, sp: true, adena: true, aa: true, coinLuck: true, heroJson: true, updatedAt: true,
          },
        });

        return { updated, fishCount, expGained };
      });

      return reply.send({
        ok: true,
        character: { ...updated, exp: Number(updated.exp) },
        fishCount,
        expGained,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg === "character not found" ||
          msg === "no active fishing session" ||
          msg === "fishing not ready yet (1 hour required)" ||
          msg === "invalid fishing reward"
        ) {
          const code = msg === "character not found" ? 404 : 400;
          return reply.code(code).send({ error: msg });
        }
      }
      app.log.error(error, "POST /characters/:id/fishing/collect");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  // POST /characters/:id/fish/dismantle — розділка риби на сервері (дроп зберігається в БД, без відкату)
  app.post("/characters/:id/fish/dismantle", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as any;
    // Підтримка body як об'єкт { itemId, amount } або масив [{ itemId, amount }]
    const payload = Array.isArray(body) ? body[0] : body;
    const itemId = payload?.itemId ?? body?.itemId ?? "fish_seawater";
    const amount = Math.max(1, Math.min(9999, Math.floor(Number(payload?.amount ?? body?.amount ?? 1))));

    try {
      const owner = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true },
      });
      if (!owner) return reply.code(404).send({ error: "character not found" });

      const { updated, dropResult } = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${owner.id} FOR UPDATE`;

        const ch = await tx.character.findUnique({
          where: { id: owner.id },
          select: { id: true, adena: true, heroJson: true },
        });
        if (!ch) throw new Error("character not found");

        const heroJson = (ch.heroJson ?? {}) as any;
        const inv: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
        const fishIdx = inv.findIndex((i: any) => (i?.id ?? i?.itemId) === itemId);
        if (fishIdx < 0) throw new Error("fish not found in inventory");
        const fishItem = inv[fishIdx];
        const fishCount = Number(fishItem?.count ?? 1);
        if (fishCount < amount) throw new Error("not enough fish");

        const dropResult = processFishDrop(amount);
        const itemsToAdd = buildItemsFromDrop(dropResult);

        const invAfterFish = inv
          .map((item: any, idx: number) => {
            if (idx !== fishIdx) return item;
            const newCount = (Number(item.count) ?? 1) - amount;
            return newCount > 0 ? { ...item, count: newCount } : null;
          })
          .filter(Boolean) as any[];

        const maxNormal = 99;
        const overflowChest: any[] = Array.isArray(heroJson.overflowChest) ? [...heroJson.overflowChest] : [];
        const stackableSlots = new Set(["consumable", "resource", "quest"]);

        for (const toAdd of itemsToAdd) {
          const count = toAdd.count ?? 1;
          const stackable = stackableSlots.has(toAdd.slot ?? "");
          const itemObj = { id: toAdd.id, name: toAdd.name, slot: toAdd.slot, icon: toAdd.icon, count, type: toAdd.type };

          if (stackable) {
            const idx = invAfterFish.findIndex((i: any) => (i?.id ?? i?.itemId) === toAdd.id);
            if (idx >= 0) {
              invAfterFish[idx] = { ...invAfterFish[idx], count: (invAfterFish[idx].count ?? 1) + count };
            } else if (invAfterFish.length < maxNormal) {
              invAfterFish.push({ ...itemObj });
            } else {
              overflowChest.push({ ...itemObj });
            }
          } else {
            for (let i = 0; i < count; i++) {
              if (invAfterFish.length < maxNormal) {
                invAfterFish.push({ ...itemObj, count: 1 });
              } else {
                overflowChest.push({ ...itemObj, count: 1 });
              }
            }
          }
        }

        const newAdena = (Number(ch.adena) ?? 0) + (dropResult.adena ?? 0);
        const oldRevision = heroJson.heroRevision ?? 0;
        const updatedHeroJson = addVersioning(
          {
            ...heroJson,
            inventory: invAfterFish,
            overflowChest,
            adena: newAdena,
          },
          oldRevision
        );

        const charUpdated = await tx.character.update({
          where: { id: ch.id },
          data: {
            adena: newAdena,
            heroJson: updatedHeroJson,
            lastActivityAt: new Date(),
          },
          select: {
            id: true, name: true, race: true, classId: true, sex: true, level: true,
            exp: true, sp: true, adena: true, aa: true, coinLuck: true, heroJson: true, updatedAt: true,
          },
        });
        return { updated: charUpdated, dropResult };
      });

      const hj = (updated.heroJson as any) || {};
      return reply.send({
        ok: true,
        character: { ...updated, exp: Number(updated.exp), heroJson: hj },
        dropResult,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (msg === "character not found" || msg === "fish not found in inventory" || msg === "not enough fish") {
          return reply.code(msg === "character not found" ? 404 : 400).send({ error: msg });
        }
      }
      app.log.error(error, "POST /characters/:id/fish/dismantle");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });
}