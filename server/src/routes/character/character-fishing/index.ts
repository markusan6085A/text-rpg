import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { addVersioning } from "../../../heroJsonValidator";

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
        const rodSlot =
          equipment["weapon"] === ROD_ITEM_ID ? "weapon" :
          equipment["lrhand"] === ROD_ITEM_ID ? "lrhand" :
          equipment["shield"] === ROD_ITEM_ID ? "shield" : null;
        if (!rodSlot) throw new Error("rod required (Baby Duck Rod)");
        const rodEnchant = Number(encLevels[rodSlot]) || 0;

        const inv: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
        const baitIdx = inv.findIndex((i: any) => (i?.id ?? i?.itemId) === BAIT_ITEM_ID && (Number(i?.count) ?? 0) > 0);
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
          select: { id: true, heroJson: true },
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
        const oldRevision = heroJson.heroRevision ?? 0;
        const updatedHeroJson = addVersioning(
          { ...restHero, inventory: inv },
          oldRevision
        );

        const updated = await tx.character.update({
          where: { id: ch.id },
          data: {
            exp: { increment: expGained },
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
}