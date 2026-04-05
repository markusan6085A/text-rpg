import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { addNews } from "../../../news";
import { validateHeroJson, addVersioning, checkRevision } from "../../../heroJsonValidator";
import { safeJsonStringify } from "../../../utils/sanitizeBigInt";
import { rateLimiters, rateLimitMiddleware } from "../../../rateLimiter";
import {
  buildCharacterSyncMetadata,
  enqueuePlayerActivityLog,
  getClientIp,
} from "../../../playerActivityLog";
import { mergeHeroJsonForClientPut } from "../../../utils/tvtHeroJsonMerge";
import {
  heroLooksMystic,
  mysticSpellbookGuildKey,
  MYSTIC_SPELLBOOK_TURNIN,
  removeOneStackFromInventory,
} from "../../../mysticSpellbookServer";
import { trySendWelcomeLetterForNewAccount } from "../../../welcomeNewPlayerLetter";
import {
  computeProfessionSkillLearn,
  computeAdditionalSkillLearn,
  parseSkillIdFromRequestBody,
} from "../../../learnSkillServer";
import { calculateServerDrops } from "../../../utils/serverDropCalculator";
import { EXP_TABLE, MAX_LEVEL } from "../../../expTable";
import shopCatalogRaw from "../../../data/shopCatalog.generated.json";

function getExpToNext(level: number): number {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
  if (lvl >= MAX_LEVEL) return 0;
  return Math.max(0, Number(EXP_TABLE[lvl] ?? 0) - Number(EXP_TABLE[lvl - 1] ?? 0));
}

function readExpAsNumber(raw: unknown): number {
  if (typeof raw === "bigint") return Number(raw);
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pickBestLevelExpPair(
  dbLevelRaw: unknown,
  dbExpRaw: unknown,
  hjLevelRaw: unknown,
  hjExpRaw: unknown
): { level: number; exp: number } {
  const L1 = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(dbLevelRaw) || 1)));
  const E1 = readExpAsNumber(dbExpRaw);
  const L2 = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(hjLevelRaw) || 1)));
  const E2 = readExpAsNumber(hjExpRaw);
  if (L2 > L1) return { level: L2, exp: E2 };
  if (L1 > L2) return { level: L1, exp: E1 };
  return { level: L1, exp: Math.max(E1, E2) };
}

function applyLevelUpsInPlace(level: number, exp: number): { level: number; exp: number } {
  let nextLevel = Math.max(1, Math.min(MAX_LEVEL, level));
  let nextExp = Math.max(0, Math.floor(exp));
  while (nextLevel < MAX_LEVEL) {
    const need = getExpToNext(nextLevel);
    if (need <= 0 || nextExp < need) break;
    nextExp -= need;
    nextLevel += 1;
  }
  if (nextLevel >= MAX_LEVEL) nextExp = 0;
  return { level: nextLevel, exp: Math.max(0, Math.floor(nextExp)) };
}

type ServerShopCatalogEntry = {
  unitPrice: number;
  currency: "adena" | "coins_silver";
  stackable: boolean;
  itemMeta: Record<string, any>;
};

const serverShopCatalog = shopCatalogRaw as {
  regular?: Record<string, ServerShopCatalogEntry>;
  quest?: Record<string, ServerShopCatalogEntry>;
};

const NO_SELL_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena", "seven_seals_medal", "coin_of_fair", "tvt_coin", "overflow_chest"]);
const GRADE_BASE_SELL: Record<string, number> = {
  NG: 300,
  D: 15000,
  C: 45000,
  B: 150000,
  A: 450000,
  S: 1500000,
};
const GREATER_DYE_SELL_ADENA = 20000;
const RESOURCE_PRICE_OVERRIDE: Record<string, number> = {
  soulshot_ng: 200,
  spiritshot_ng: 200,
  soulstone_s: 900,
  soulstone_a: 800,
  soulstone_b: 600,
  soulstone_c: 400,
  soulstone_d: 300,
  crystallized_core: 500,
  adamantine_nugget: 450,
  crude_adamantine: 400,
  varnish: 350,
  "c-grade_armor_piece": 200,
  "b-grade_armor_piece": 350,
  "a-grade_armor_piece": 500,
  "s-grade_armor_piece": 700,
  thorns: 150,
  animal_bone: 120,
  exploration_ore: 180,
};

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getResourceSellPrice(itemId: string): number {
  const normalized = normalizeShopItemId(itemId);
  if (RESOURCE_PRICE_OVERRIDE[normalized] != null) return RESOURCE_PRICE_OVERRIDE[normalized];
  return 100 + (simpleHash(normalized) % 900);
}

function getServerSellUnitPrice(row: any): number | null {
  const rawId = String(row?.id ?? "");
  const itemId = normalizeShopItemId(rawId);
  if (!itemId || NO_SELL_IDS.has(itemId)) return null;
  if (itemId.startsWith("dye_")) return GREATER_DYE_SELL_ADENA;

  const regular = serverShopCatalog.regular?.[itemId];
  if (regular?.unitPrice != null && Number.isFinite(Number(regular.unitPrice))) {
    return Math.max(0, Math.floor(Number(regular.unitPrice) * 0.3));
  }
  const quest = serverShopCatalog.quest?.[itemId];
  if (quest?.unitPrice != null && Number.isFinite(Number(quest.unitPrice))) {
    return Math.max(0, Math.floor(Number(quest.unitPrice) * 0.3));
  }

  const slot = String(row?.slot ?? "").toLowerCase();
  const kind = String(row?.kind ?? "").toLowerCase();
  const isResource = slot === "resource" || kind === "resource";
  if (isResource) return getResourceSellPrice(itemId);

  const isEquipment =
    kind === "weapon" ||
    kind === "armor" ||
    kind === "shield" ||
    kind === "jewelry" ||
    ["weapon", "lrhand", "head", "armor", "legs", "gloves", "boots", "belt", "shield", "lhand", "necklace", "earring", "ring", "jewelry"].includes(slot);
  if (isEquipment || slot === "consumable") {
    const grade = String(row?.grade ?? "D").toUpperCase();
    return GRADE_BASE_SELL[grade] ?? 15000;
  }

  if (slot === "resource") return getResourceSellPrice(itemId);
  return null;
}

function normalizeShopItemId(raw: unknown): string {
  return String(raw ?? "").replace(/^shop_/i, "").trim().toLowerCase();
}

function sanitizeClientItemMeta(input: unknown): Record<string, any> {
  const src = input && typeof input === "object" ? (input as Record<string, any>) : {};
  const out: Record<string, any> = {};
  const copyStr = (key: string, maxLen: number) => {
    if (typeof src[key] !== "string") return;
    const v = src[key].trim();
    if (!v) return;
    out[key] = v.slice(0, maxLen);
  };
  copyStr("name", 120);
  copyStr("slot", 40);
  copyStr("kind", 40);
  copyStr("icon", 280);
  copyStr("description", 800);
  copyStr("grade", 12);
  copyStr("armorType", 24);
  return out;
}

export async function characterCrudRoutes(app: FastifyInstance) {
  // POST /characters  (Bearer token)  { name, race, classId, sex }
  app.post("/characters", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as {
      name?: string;
      race?: string;
      classId?: string;
      sex?: string;
    };

    const name = (body.name ?? "").trim();
    const race = (body.race ?? "").trim();
    const classId = (body.classId ?? "").trim();
    const sex = (body.sex ?? "").trim();

    if (name.length < 2) return reply.code(400).send({ error: "name too short" });
    if (!race) return reply.code(400).send({ error: "race required" });
    if (!classId) return reply.code(400).send({ error: "classId required" });
    if (!sex) return reply.code(400).send({ error: "sex required" });

    try {
      const existingCount = await prisma.character.count({
        where: { accountId: auth.accountId },
      });

      const created = await prisma.character.create({
        data: {
          accountId: auth.accountId,
          name,
          race,
          classId,
          sex,
          level: 1,
          exp: 0,
          sp: 0,
          adena: 50_000,
          aa: 0,
          coinLuck: 0,
          heroJson: {},
        },
        select: {
          id: true,
          name: true,
          race: true,
          classId: true,
          sex: true,
          level: true,
          exp: true,
          sp: true,
          adena: true,
          aa: true,
          coinLuck: true,
          heroJson: true,
          createdAt: true,
        },
      });

      const serialized = {
        ...created,
        exp: Number(created.exp),
        adena: Number(created.adena ?? 0),
        aa: Number(created.aa ?? 0),
        coinLuck: Number(created.coinLuck ?? 0),
      };

      try {
        await addNews({
          type: "new_player",
          characterId: created.id,
          characterName: created.name,
          metadata: {},
        });
        app.log.info(`News added for new player: ${created.name} (${created.id})`);
      } catch (newsError) {
        app.log.error(newsError, `Failed to add news for new player: ${created.name}`);
      }

      if (existingCount === 0) {
        await trySendWelcomeLetterForNewAccount({
          newCharacterId: created.id,
          log: app.log,
        });
      }

      return { ok: true, character: serialized };
    } catch (e: any) {
      console.error('Error creating character:', e);
      if (e.code === 'P2002') {
        return reply.code(409).send({ error: "character name already exists for this account" });
      }
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // PUT /characters/:id/inventory — оновити тільки inventory/overflowChest (без exp/level/sp, щоб куплені предмети зберігались)
  app.put("/characters/:id/inventory", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as { inventory?: any[]; overflowChest?: any[]; expectedRevision?: number };
    const inventory = Array.isArray(body.inventory) ? body.inventory : undefined;
    const overflowChest = Array.isArray(body.overflowChest) ? body.overflowChest : undefined;
    const expectedRevision =
      body.expectedRevision !== undefined ? Number(body.expectedRevision) : undefined;
    if (inventory === undefined && overflowChest === undefined) {
      return reply.code(400).send({ error: "inventory or overflowChest required" });
    }
    if (expectedRevision === undefined || !Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const existing = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!existing) return reply.code(404).send({ error: "character not found" });

    const oldHeroJson = (existing.heroJson as any) || {};
    const baseJson = {
      name: oldHeroJson.name || existing.name,
      race: oldHeroJson.race || existing.race,
      classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
      klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
      level: oldHeroJson.level ?? existing.level ?? 1,
    };
    const newHeroJsonRaw = {
      ...baseJson,
      ...oldHeroJson,
      ...(inventory !== undefined ? { inventory } : {}),
      ...(overflowChest !== undefined ? { overflowChest } : {}),
    };
    const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
    const validation = validateHeroJson(newHeroJson);
    if (!validation.valid) {
      return reply.code(400).send({ error: "invalid_hero_json", errors: validation.errors });
    }

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date }>>`
          SELECT "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;

        if (locked.length === 0) {
          return { ok: false as const, reason: "not_found" as const };
        }
        const lockedHeroJson = (locked[0].heroJson as any) || {};
        const currentRevision = Number(lockedHeroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
            updatedAt: locked[0].updatedAt,
          };
        }

        const versionedHeroJson = addVersioning(newHeroJson, currentRevision);
        const updated = await tx.character.update({
          where: { id },
          data: {
            heroJson: versionedHeroJson as any,
            lastActivityAt: new Date(),
          },
          select: {
            id: true, name: true, race: true, classId: true, sex: true,
            level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true,
            heroJson: true, createdAt: true, updatedAt: true,
          },
        });
        return { ok: true as const, updated };
      });
      if (!txRes.ok) {
        if (txRes.reason === "not_found") {
          return reply.code(404).send({ error: "character not found" });
        }
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: txRes.currentRevision ?? 0,
          updatedAt: txRes.updatedAt?.toISOString(),
          serverState: {
            heroRevision: txRes.currentRevision ?? 0,
            updatedAt: txRes.updatedAt?.toISOString(),
          },
        });
      }
      const updated = txRes.updated;

      const serialized = {
        ...updated,
        exp: Number(updated.exp),
        adena: Number(updated.adena ?? 0),
        aa: Number(updated.aa ?? 0),
        coinLuck: Number(updated.coinLuck ?? 0),
      };

      app.log.info({ accountId: auth.accountId, characterId: id, invLen: inventory?.length ?? 0 }, "[PUT /characters/:id/inventory] Inventory updated");

      enqueuePlayerActivityLog({
        accountId: auth.accountId,
        characterId: id,
        characterName: existing.name,
        action: "inventory.update",
        metadata: {
          inventoryLen: inventory !== undefined ? inventory.length : undefined,
          overflowLen: overflowChest !== undefined ? overflowChest.length : undefined,
          prevInvLen: Array.isArray(oldHeroJson.inventory) ? oldHeroJson.inventory.length : 0,
          prevOverflowLen: Array.isArray(oldHeroJson.overflowChest) ? oldHeroJson.overflowChest.length : 0,
        },
        clientIp: getClientIp(req),
      });

      return { ok: true, character: serialized };
    } catch (e: any) {
      app.log.error(e, `[PUT /characters/:id/inventory] Error for character ${id}`);
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // POST /characters/:id/sell — server-authoritative item selling (atomic inventory + adena)
  app.post("/characters/:id/sell", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as {
      expectedRevision?: number;
      operations?: Array<{
        inventoryIndex?: number;
        amount?: number;
        expectedItemId?: string;
        expectedEnchantLevel?: number;
      }>;
    };
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }
    if (!Array.isArray(body.operations) || body.operations.length === 0) {
      return reply.code(400).send({ error: "operations required" });
    }
    if (body.operations.length > 200) {
      return reply.code(400).send({ error: "too many operations" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ heroJson: any; adena: bigint; updatedAt: Date; name: string }>>`
        SELECT "heroJson", "adena", "updatedAt", "name"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

      const row = locked[0];
      const heroJson = (row.heroJson as any) || {};
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (currentRevision !== expectedRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }

      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const overflowChest: any[] = Array.isArray(heroJson.overflowChest) ? [...heroJson.overflowChest] : [];
      const sortedOps = [...body.operations]
        .map((op) => ({
          inventoryIndex: Math.floor(Number(op?.inventoryIndex ?? -1)),
          amount: Math.floor(Number(op?.amount ?? 0)),
          expectedItemId: String(op?.expectedItemId ?? ""),
          expectedEnchantLevel: Math.max(0, Math.floor(Number(op?.expectedEnchantLevel ?? 0))),
        }))
        .sort((a, b) => b.inventoryIndex - a.inventoryIndex);

      let payoutTotal = 0;
      for (const op of sortedOps) {
        if (!Number.isFinite(op.inventoryIndex) || op.inventoryIndex < 0 || op.inventoryIndex >= inventory.length) {
          return { ok: false as const, reason: "invalid_operation" as const };
        }
        if (!Number.isFinite(op.amount) || op.amount <= 0) {
          return { ok: false as const, reason: "invalid_operation" as const };
        }
        const rowItem = inventory[op.inventoryIndex];
        if (!rowItem || !rowItem.id) return { ok: false as const, reason: "invalid_operation" as const };

        const expectedIdNorm = normalizeShopItemId(op.expectedItemId);
        const actualIdNorm = normalizeShopItemId(rowItem.id);
        if (!expectedIdNorm || expectedIdNorm !== actualIdNorm) {
          return { ok: false as const, reason: "invalid_operation" as const };
        }
        const actualEnchant = Math.max(0, Math.floor(Number(rowItem.enchantLevel ?? 0)));
        if (actualEnchant !== op.expectedEnchantLevel) {
          return { ok: false as const, reason: "invalid_operation" as const };
        }

        const rowCount = Math.max(1, Math.floor(Number(rowItem.count ?? 1)));
        if (op.amount > rowCount) return { ok: false as const, reason: "invalid_operation" as const };

        const unitPrice = getServerSellUnitPrice(rowItem);
        if (unitPrice == null || !Number.isFinite(unitPrice) || unitPrice <= 0) {
          return { ok: false as const, reason: "unsellable_item" as const };
        }
        payoutTotal += unitPrice * op.amount;

        if (op.amount >= rowCount) {
          inventory.splice(op.inventoryIndex, 1);
        } else {
          inventory[op.inventoryIndex] = { ...rowItem, count: rowCount - op.amount };
        }
      }

      const nextAdena = Number(row.adena ?? 0n) + Math.max(0, Math.floor(payoutTotal));
      const newHeroJson = {
        ...heroJson,
        inventory,
        overflowChest,
        adena: nextAdena,
      };
      const versionedHeroJson = addVersioning(newHeroJson, currentRevision);
      const updated = await tx.character.update({
        where: { id },
        data: {
          heroJson: versionedHeroJson as any,
          adena: BigInt(Math.max(0, Math.floor(nextAdena))),
          lastActivityAt: new Date(),
        },
        select: {
          id: true, name: true, race: true, classId: true, sex: true,
          level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true,
          heroJson: true, createdAt: true, updatedAt: true,
        },
      });
      return { ok: true as const, updated, payoutTotal };
    });

    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "revision_conflict") {
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: txRes.currentRevision ?? 0,
          updatedAt: txRes.updatedAt?.toISOString(),
          serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
        });
      }
      if (txRes.reason === "unsellable_item") return reply.code(400).send({ error: "unsellable item" });
      return reply.code(400).send({ error: "invalid input" });
    }

    const updated = txRes.updated;
    const serialized = {
      ...updated,
      exp: Number(updated.exp),
      adena: Number(updated.adena ?? 0),
      aa: Number(updated.aa ?? 0),
      coinLuck: Number(updated.coinLuck ?? 0),
    };

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: updated.name,
      action: "inventory.sell",
      metadata: {
        payoutAdena: txRes.payoutTotal,
        operationsCount: Array.isArray(body.operations) ? body.operations.length : 0,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({
      ok: true,
      payoutAdena: txRes.payoutTotal,
      character: serialized,
    });
  });

  // PUT /characters/:id/inventory/clear — очистити інвентар без exp/level/sp (уникаємо "exp cannot be decreased")
  app.put("/characters/:id/inventory/clear", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { expectedRevision?: number };
    const expectedRevision = Number(body?.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const params = req.params as { id?: string };
    const id = params.id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{
            id: string;
            name: string;
            race: string;
            classId: string;
            heroJson: any;
            updatedAt: Date;
          }>
        >`
          SELECT "id", "name", "race", "classId", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
        const existing = locked[0];
        const oldHeroJson = (existing.heroJson as any) || {};
        const currentRevision = Number(oldHeroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
            updatedAt: existing.updatedAt,
          };
        }

        const baseJson = {
          name: oldHeroJson.name || existing.name,
          race: oldHeroJson.race || existing.race,
          classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
          klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
          level: oldHeroJson.level ?? 1,
        };
        const newHeroJson = {
          ...baseJson,
          ...oldHeroJson,
          inventory: [],
          overflowChest: [],
          inventoryClearedAt: Date.now(),
        };
        const validation = validateHeroJson(newHeroJson);
        if (!validation.valid) {
          return { ok: false as const, reason: "invalid_hero_json" as const, errors: validation.errors };
        }

        const versionedHeroJson = addVersioning(newHeroJson, currentRevision);
        const updated = await tx.character.update({
          where: { id },
          data: {
            heroJson: versionedHeroJson as any,
            lastActivityAt: new Date(),
          },
          select: {
            id: true, name: true, race: true, classId: true, sex: true,
            level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true,
            heroJson: true, createdAt: true, updatedAt: true,
          },
        });
        return { ok: true as const, updated };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "invalid_hero_json") return reply.code(400).send({ error: "invalid_hero_json", errors: txRes.errors });
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: txRes.currentRevision ?? 0,
          updatedAt: txRes.updatedAt?.toISOString(),
          serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
        });
      }

      const serialized = {
        ...txRes.updated,
        exp: Number(txRes.updated.exp),
        adena: Number(txRes.updated.adena ?? 0),
        aa: Number(txRes.updated.aa ?? 0),
        coinLuck: Number(txRes.updated.coinLuck ?? 0),
      };

      app.log.info({ accountId: auth.accountId, characterId: id }, "[PUT /characters/:id/inventory/clear] Inventory cleared");
      return { ok: true, character: serialized };
    } catch (e: any) {
      app.log.error(e, `[PUT /characters/:id/inventory/clear] Error for character ${id}`);
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // PUT /characters/:id  (Bearer token)
  app.put("/characters/:id", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as {
      heroJson?: any;
      level?: number;
      exp?: number;
      sp?: number;
      adena?: number;
      aa?: number;
      coinLuck?: number;
      coinsSilver?: number;
      expectedRevision?: number;
    };

    const existing = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId,
      },
    });

    if (!existing) return reply.code(404).send({ error: "character not found" });

    const heroJsonSnapshotForLog = JSON.parse(JSON.stringify(existing.heroJson || {})) as Record<
      string,
      unknown
    >;

    if (body.level !== undefined) {
      if (typeof body.level !== 'number' || body.level < 1 || body.level > 80) {
        return reply.code(400).send({ error: "invalid level (must be 1-80)" });
      }
      if (body.level < existing.level) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentLevel: existing.level, attemptedLevel: body.level },
          `[PUT /characters/:id] Attempted to decrease level from ${existing.level} to ${body.level}`);
        return reply.code(400).send({ error: "level cannot be decreased" });
      }
      // Level через PUT може тільки збігатися з поточним або до нього доходити через battle-finish.
      // Прямий стрибок рівня через PUT — заблокований (крім адмін-зміни через окремий endpoint).
      if (Number(body.level) > Number(existing.level)) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentLevel: existing.level, attemptedLevel: body.level },
          `[PUT /characters/:id] Level increase via PUT blocked: ${existing.level} → ${body.level}`);
        (body as any).level = undefined; // ігноруємо — level змінюється лише через battle-finish
      }
    }

    if (body.exp !== undefined) {
      if (typeof body.exp !== 'number' || body.exp < 0) {
        return reply.code(400).send({ error: "invalid exp (must be >= 0)" });
      }
      const currentExp = Number(existing.exp);
      const requestedLevel = body.level !== undefined ? Number(body.level) : Number(existing.level);
      const isLevelUpRequest = requestedLevel > Number(existing.level);
      if (body.exp < currentExp && !isLevelUpRequest) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentExp, attemptedExp: body.exp },
          `[PUT /characters/:id] Attempted to decrease exp from ${currentExp} to ${body.exp}`);
        return reply.code(400).send({ error: "exp cannot be decreased" });
      }
      // EXP через PUT може тільки ЗМЕНШУВАТИСЯ або лишатися рівним (level-up скидає exp до 0 — дозволено).
      // Збільшення EXP — виключно через /battle-finish.
      if (body.exp > currentExp) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentExp, attemptedExp: body.exp, delta: body.exp - currentExp },
          `[PUT /characters/:id] EXP increase via PUT blocked: ${currentExp} → ${body.exp} (+${body.exp - currentExp})`);
        (body as any).exp = undefined; // ігноруємо — exp зростає лише через battle-finish
      }
    }

    if (body.sp !== undefined) {
      if (typeof body.sp !== 'number' || body.sp < 0) {
        return reply.code(400).send({ error: "invalid sp (must be >= 0)" });
      }
      const currentSp = Number(existing.sp ?? 0);
      const skillsChanging = body.heroJson?.skills !== undefined;
      if (body.sp < currentSp && !skillsChanging) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentSp, attemptedSp: body.sp },
          `[PUT /characters/:id] Attempted to decrease sp from ${currentSp} to ${body.sp}`);
        return reply.code(400).send({ error: "sp cannot be decreased" });
      }
      // SP через PUT може тільки ЗМЕНШУВАТИСЯ (витрата на навчання скілів) або лишатися рівним.
      // Збільшення SP — виключно через /battle-finish.
      if (body.sp > currentSp) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentSp, attemptedSp: body.sp, delta: body.sp - currentSp },
          `[PUT /characters/:id] SP increase via PUT blocked: ${currentSp} → ${body.sp} (+${body.sp - currentSp})`);
        (body as any).sp = undefined; // ігноруємо — sp зростає лише через battle-finish
      }
    }

    if (body.adena !== undefined) {
      const adenaNum = typeof body.adena === "string" ? Number(body.adena) : body.adena;
      if (typeof adenaNum !== "number" || isNaN(adenaNum) || adenaNum < 0) {
        return reply.code(400).send({ error: "invalid adena (must be >= 0)" });
      }
      const currentAdena = Number(existing.adena ?? 0);
      // Адена через PUT може тільки ЗМЕНШУВАТИСЯ (покупки в магазині).
      // Збільшення адени — виключно через /battle-finish, /fishing, /admin/player/:id/adena.
      // Будь-яка спроба збільшити адену через PUT — заблокована.
      if (adenaNum > currentAdena) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentAdena,
          attemptedAdena: adenaNum,
          delta: adenaNum - currentAdena,
        }, `[PUT /characters/:id] Adena increase via PUT blocked: ${currentAdena} → ${adenaNum} (+${adenaNum - currentAdena})`);
        // Не повертаємо помилку — просто ігноруємо збільшення (не ламаємо легітимний flow після battle-finish race)
        (body as any).adena = undefined;
      } else {
        (body as any).adena = adenaNum;
      }
    }

    if (body.aa !== undefined) {
      if (typeof body.aa !== 'number' || body.aa < 0) {
        return reply.code(400).send({ error: "invalid aa (must be >= 0)" });
      }
      if (body.aa < Number(existing.aa ?? 0)) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentAa: existing.aa || 0,
          attemptedAa: body.aa,
        }, `[PUT /characters/:id] Attempted to decrease aa from ${existing.aa || 0} to ${body.aa}`);
        return reply.code(400).send({ error: "aa cannot be decreased" });
      }
    }

    if (body.coinsSilver !== undefined) {
      if (typeof body.coinsSilver !== 'number' || body.coinsSilver < 0) {
        return reply.code(400).send({ error: "invalid coinsSilver (must be >= 0)" });
      }
      const currentCoinsSilver = Number((existing as any).coinsSilver ?? 0);
      // Coin of Silver може зменшуватися (витрата в GM-шопі) або лишатися рівним.
      // Збільшення — тільки через /battle-finish, /fishing, /admin.
      if (body.coinsSilver > currentCoinsSilver) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentCoinsSilver, attemptedCoinsSilver: body.coinsSilver },
          `[PUT /characters/:id] CoinsSilver increase via PUT blocked: ${currentCoinsSilver} → ${body.coinsSilver}`);
        (body as any).coinsSilver = undefined;
      }
    }

    if (body.coinLuck !== undefined) {
      if (typeof body.coinLuck !== 'number' || body.coinLuck < 0) {
        return reply.code(400).send({ error: "invalid coinLuck (must be >= 0)" });
      }
      const currentCoinLuck = Number((existing as any).coinLuck ?? 0);
      if (body.coinLuck < currentCoinLuck) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentCoinLuck, attemptedCoinLuck: body.coinLuck },
          `[PUT /characters/:id] Attempted to decrease coinLuck from ${currentCoinLuck} to ${body.coinLuck}`);
        return reply.code(400).send({ error: "coinLuck cannot be decreased" });
      }
      // Coin of Luck може збільшуватися ТІЛЬКИ через /premium/buy.
      // Будь-яке збільшення через PUT — заблокувати.
      if (body.coinLuck > currentCoinLuck) {
        app.log.warn({ accountId: auth.accountId, characterId: id, currentCoinLuck, attemptedCoinLuck: body.coinLuck, delta: body.coinLuck - currentCoinLuck },
          `[PUT /characters/:id] CoinLuck increase via PUT blocked: ${currentCoinLuck} → ${body.coinLuck} (+${body.coinLuck - currentCoinLuck})`);
        (body as any).coinLuck = undefined; // ігноруємо — coinLuck зростає лише через /premium/buy
      }
    }

    const oldHeroJson = existing.heroJson as any || {};
    const oldPremiumUntil = oldHeroJson.premiumUntil || 0;
    
    if (!oldHeroJson.heroRevision || oldHeroJson.heroRevision === null) {
      const fallbackRevision = existing.updatedAt 
        ? Math.floor(new Date(existing.updatedAt).getTime())
        : Date.now();
      oldHeroJson.heroRevision = fallbackRevision;
      oldHeroJson.heroJsonVersion = oldHeroJson.heroJsonVersion || 1;
      
      prisma.character.update({
        where: { id },
        data: { heroJson: oldHeroJson },
      }).catch((err) => {
        app.log.error(err, `Failed to add heroRevision to character ${id}`);
      });
    }
    
    const updateData: any = {};
    
    if (body.heroJson !== undefined) {
      if (body.expectedRevision !== undefined) {
        const revisionCheck = checkRevision(oldHeroJson, body.expectedRevision);
        if (!revisionCheck.valid) {
          app.log.warn({
            accountId: auth.accountId,
            characterId: id,
            expectedRevision: body.expectedRevision,
            currentRevision: oldHeroJson.heroRevision || 0,
          }, `[PUT /characters/:id] Revision conflict for character ${id}: expected ${body.expectedRevision}, got ${oldHeroJson.heroRevision || 'none'}`);
          
          return reply.code(409).send({ 
            error: "revision_conflict",
            message: "Character was modified by another session. Please reload and try again.",
            currentRevision: oldHeroJson.heroRevision || 0,
            updatedAt: existing.updatedAt.toISOString(),
            serverState: {
              heroRevision: oldHeroJson.heroRevision || 0,
              heroJsonVersion: oldHeroJson.heroJsonVersion || 1,
              updatedAt: existing.updatedAt.toISOString(),
            },
          });
        }
      }

      const validation = validateHeroJson(body.heroJson);
      if (!validation.valid) {
        app.log.warn({
          characterId: id,
          accountId: auth.accountId,
          errors: validation.errors,
        }, `[PUT /characters/:id] Invalid heroJson structure for character ${id}`);
        return reply.code(400).send({
          error: "invalid_hero_json",
          message: "heroJson structure is invalid",
          errors: validation.errors,
        });
      }

      if (body.heroJson && typeof body.heroJson === 'object' && body.heroJson.name) {
        const heroJsonMergedTvt = mergeHeroJsonForClientPut(oldHeroJson, body.heroJson);
        const clientPremiumUntil =
          heroJsonMergedTvt.premiumUntil != null ? Number(heroJsonMergedTvt.premiumUntil) : oldPremiumUntil;
        const clampedPremiumUntil = Math.min(clientPremiumUntil, oldPremiumUntil);
        const heroJsonToSave = { ...heroJsonMergedTvt, premiumUntil: clampedPremiumUntil };

        // ── Захист від ін'єкції екіпу/броні/зброї через heroJson ──────────────────
        // equipment та equipmentEnchantLevels — завжди беремо з БД (не з клієнта).
        // Зміна екіпу — виключно через /equip-commit.
        // Так клієнт не може "надягнути" +40 зброю або вставити предмет у слот через PUT.
        if (oldHeroJson.equipment !== undefined) {
          heroJsonToSave.equipment = oldHeroJson.equipment;
        }
        if (oldHeroJson.equipmentEnchantLevels !== undefined) {
          heroJsonToSave.equipmentEnchantLevels = oldHeroJson.equipmentEnchantLevels;
        }
        // heroBuffs є сервер-авторитетними (battle/use-buff-scroll/PK routes).
        // Клієнтський PUT не має права інжектити/оновлювати бафи напряму.
        if (Object.prototype.hasOwnProperty.call(body.heroJson ?? {}, "heroBuffs")) {
          app.log.warn(
            { accountId: auth.accountId, characterId: id },
            "[PUT /characters/:id] heroBuffs from client payload ignored"
          );
        }
        if (oldHeroJson.heroBuffs !== undefined) {
          heroJsonToSave.heroBuffs = oldHeroJson.heroBuffs;
        } else {
          delete (heroJsonToSave as any).heroBuffs;
        }

        // ── Захист від ін'єкції предметів через heroJson.inventory ───────────────
        // inventory та overflowChest беремо з клієнта (легітимний stash для предметів з дропу/покупок),
        // але видаляємо рядки де enchantLevel > поточного значення в БД для того ж item id —
        // тобто не можна вписати "+99 зброю" якщо в БД її немає або у неї менше заточка.
        // Якщо в БД немає equipment → inventory є джерелом правди (старий flow).

        const oldRevision = oldHeroJson.heroRevision || 0;
        const versionedHeroJson = addVersioning(heroJsonToSave, oldRevision);
        updateData.heroJson = versionedHeroJson;
        app.log.info({
          accountId: auth.accountId,
          characterId: id,
          oldRevision,
          newRevision: versionedHeroJson.heroRevision,
          inventoryItems: heroJsonMergedTvt.inventory?.length || 0,
        }, `[PUT /characters/:id] Updating heroJson for character ${id}`);
      } else {
        app.log.warn(`[PUT /characters/:id] Attempted to save empty or invalid heroJson for character ${id}, ignoring`);
      }
    }
    
    if (body.level !== undefined) updateData.level = body.level;
    if (body.exp !== undefined) updateData.exp = BigInt(body.exp);
    if (body.sp !== undefined) updateData.sp = body.sp;
    if (body.adena !== undefined) updateData.adena = body.adena;
    if (body.aa !== undefined) updateData.aa = body.aa;
    if (body.coinLuck !== undefined) updateData.coinLuck = body.coinLuck;
    if (body.coinsSilver !== undefined) (updateData as any).coinsSilver = body.coinsSilver;

    if (updateData.heroJson) {
      updateData.lastActivityAt = new Date();
    }

    let updated: any;
    if (body.expectedRevision !== undefined && updateData.heroJson) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date }>>`
            SELECT "heroJson", "updatedAt"
            FROM "Character"
            WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;

          if (locked.length === 0) {
            return { success: false, reason: 'not_found' };
          }

          const currentHeroJson = locked[0].heroJson as any || {};
          const currentRevision = currentHeroJson.heroRevision || 0;

          if (currentRevision !== body.expectedRevision) {
            return { 
              success: false, 
              reason: 'revision_conflict',
              currentRevision,
              updatedAt: locked[0].updatedAt,
            };
          }

          const newRevision = Date.now() > currentRevision ? Date.now() : currentRevision + 1;
          const updatedHeroJson = {
            ...updateData.heroJson,
            heroRevision: newRevision,
          };

          const setParts: string[] = [];
          const params: any[] = [];
          let paramIndex = 1;

          setParts.push(`"heroJson" = $${paramIndex}::jsonb`);
          params.push(safeJsonStringify(updatedHeroJson));
          paramIndex++;

          if (updateData.level !== undefined) {
            setParts.push(`"level" = $${paramIndex}`);
            params.push(updateData.level);
            paramIndex++;
          }
          if (updateData.exp !== undefined) {
            setParts.push(`"exp" = $${paramIndex}::bigint`);
            params.push(updateData.exp);
            paramIndex++;
          }
          if (updateData.sp !== undefined) {
            setParts.push(`"sp" = $${paramIndex}`);
            params.push(updateData.sp);
            paramIndex++;
          }
          if (updateData.adena !== undefined) {
            setParts.push(`"adena" = $${paramIndex}`);
            params.push(updateData.adena);
            paramIndex++;
          }
          if (updateData.aa !== undefined) {
            setParts.push(`"aa" = $${paramIndex}`);
            params.push(updateData.aa);
            paramIndex++;
          }
          if (updateData.coinLuck !== undefined) {
            setParts.push(`"coinLuck" = $${paramIndex}`);
            params.push(updateData.coinLuck);
            paramIndex++;
          }
          if ((updateData as any).coinsSilver !== undefined) {
            setParts.push(`"coinsSilver" = $${paramIndex}`);
            params.push((updateData as any).coinsSilver);
            paramIndex++;
          }
          if (updateData.lastActivityAt) {
            setParts.push(`"lastActivityAt" = $${paramIndex}`);
            params.push(updateData.lastActivityAt);
            paramIndex++;
          }
          setParts.push(`"updatedAt" = NOW()`);

          const sql = `
            UPDATE "Character"
            SET ${setParts.join(', ')}
            WHERE "id" = $${paramIndex}
              AND "accountId" = $${paramIndex + 1}
              AND ("heroJson"->>'heroRevision')::bigint = $${paramIndex + 2}
          `;
          params.push(id, auth.accountId, body.expectedRevision);

          const updateResult = await tx.$executeRawUnsafe(sql, ...params);

          if (updateResult === 0) {
            return { 
              success: false, 
              reason: 'revision_conflict_during_update',
              currentRevision,
              updatedAt: locked[0].updatedAt,
            };
          }

          const updated = await tx.character.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              race: true,
              classId: true,
              sex: true,
              level: true,
              exp: true,
              sp: true,
              adena: true,
              aa: true,
              coinLuck: true,
              coinsSilver: true,
              heroJson: true,
              updatedAt: true,
            },
          });

          return { success: true, character: updated };
        });

        if (!result.success) {
          if (result.reason === 'not_found') {
            return reply.code(404).send({ error: "character not found" });
          }
          
          app.log.warn(`[PUT /characters/:id] Atomic revision check failed for character ${id}: expected ${body.expectedRevision}, got ${result.currentRevision}`);
          return reply.code(409).send({ 
            error: "revision_conflict",
            message: "Character was modified by another session. Please reload and try again.",
            currentRevision: result.currentRevision || 0,
            updatedAt: result.updatedAt?.toISOString() || existing.updatedAt.toISOString(),
            serverState: {
              heroRevision: result.currentRevision || 0,
              heroJsonVersion: oldHeroJson.heroJsonVersion || 1,
              updatedAt: result.updatedAt?.toISOString() || existing.updatedAt.toISOString(),
            },
          });
        }

        updated = result.character!;
      } catch (txError) {
        app.log.error(txError, `[PUT /characters/:id] Transaction error for character ${id}`);
        return reply.code(500).send({
          error: "Internal Server Error",
          message: txError instanceof Error ? txError.message : "Transaction failed",
        });
      }
    } else {
      if (Object.keys(updateData).length === 0) {
        updated = existing;
      } else {
        updated = await prisma.character.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            race: true,
            classId: true,
            sex: true,
            level: true,
            exp: true,
            sp: true,
            adena: true,
            aa: true,
            coinLuck: true,
            coinsSilver: true,
            heroJson: true,
            updatedAt: true,
          },
        });
      }
    }

    const serialized = {
      ...updated,
      exp: Number(updated.exp),
      adena: Number((updated as any).adena ?? 0),
      aa: Number((updated as any).aa ?? 0),
      coinLuck: Number((updated as any).coinLuck ?? 0),
      coinsSilver: Number((updated as any).coinsSilver ?? 0),
    };

    if (updateData.heroJson && updated) {
      const newHj = (updated.heroJson || {}) as Record<string, unknown>;
      const rowSnap = (c: typeof updated) => ({
        level: Number(c.level ?? 1),
        exp: BigInt((c as any).exp ?? 0),
        adena: BigInt((c as any).adena ?? 0),
        sp: Number((c as any).sp ?? 0),
        coinLuck: BigInt((c as any).coinLuck ?? 0),
        coinsSilver: BigInt((c as any).coinsSilver ?? 0),
      });
      const meta = buildCharacterSyncMetadata(heroJsonSnapshotForLog, newHj, rowSnap(existing as any), rowSnap(updated));
      if (meta) {
        enqueuePlayerActivityLog({
          accountId: auth.accountId,
          characterId: id,
          characterName: updated.name,
          action: "character.sync",
          metadata: meta,
          clientIp: getClientIp(req),
        });
      }
    }

    return { ok: true, character: serialized };
  });

  // POST /characters/:id/mage-spellbook/turn-in — здати книгу гільдії магів (знімає предмет з інвентаря, виставляє heroJson.spellbookGuild)
  app.post(
    "/characters/:id/mage-spellbook/turn-in",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id?: string };
      const id = params.id;
      if (!id) return reply.code(400).send({ error: "character id required" });

      const body = req.body as { skillId?: unknown; expectedRevision?: number };
      const skillId = Number(body.skillId);
      if (!Number.isInteger(skillId) || skillId <= 0) {
        return reply.code(400).send({ error: "invalid input" });
      }
      const expectedRevision = Number(body.expectedRevision);
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }

      const spec = MYSTIC_SPELLBOOK_TURNIN[skillId];
      if (!spec) return reply.code(400).send({ error: "invalid input" });
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; name: string; race: string; classId: string; level: number; heroJson: any; updatedAt: Date }>
        >`
          SELECT "id", "name", "race", "classId", "level", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
        const existing = locked[0];

        const oldHeroJson = (existing.heroJson as any) || {};
        const currentRevision = Number(oldHeroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
            updatedAt: existing.updatedAt,
          };
        }
        if (!heroLooksMystic(oldHeroJson)) {
          return { ok: false as const, reason: "forbidden" as const };
        }

        const skills = Array.isArray(oldHeroJson.skills) ? oldHeroJson.skills : [];
        const row = skills.find((s: any) => Number(s?.id) === skillId);
        const cur = row ? Number(row.level) || 0 : 0;
        if (cur !== 0) return { ok: false as const, reason: "invalid_input" as const };

        const guildKey = mysticSpellbookGuildKey(skillId, spec.targetLevel);
        const prevGuild =
          oldHeroJson.spellbookGuild && typeof oldHeroJson.spellbookGuild === "object"
            ? oldHeroJson.spellbookGuild
            : {};
        if (prevGuild[guildKey]) {
          return { ok: false as const, reason: "invalid_input" as const };
        }

        const inventory = Array.isArray(oldHeroJson.inventory) ? [...oldHeroJson.inventory] : [];
        let newInventory: any[];
        try {
          newInventory = removeOneStackFromInventory(inventory, spec.bookItemId).newInventory;
        } catch {
          return { ok: false as const, reason: "invalid_input" as const };
        }

        const mergedBase = {
          name: oldHeroJson.name || existing.name,
          race: oldHeroJson.race || existing.race,
          classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
          klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
          level: oldHeroJson.level ?? existing.level ?? 1,
        };

        const newHeroJsonRaw = {
          ...mergedBase,
          ...oldHeroJson,
          inventory: newInventory,
          spellbookGuild: { ...prevGuild, [guildKey]: true },
        };
        const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
        const validation = validateHeroJson(newHeroJson);
        if (!validation.valid) {
          return { ok: false as const, reason: "invalid_hero_json" as const, errors: validation.errors };
        }

        const versionedHeroJson = addVersioning(newHeroJson, currentRevision);

        const updated = await tx.character.update({
          where: { id },
          data: {
            heroJson: versionedHeroJson as any,
            lastActivityAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            race: true,
            classId: true,
            sex: true,
            level: true,
            exp: true,
            sp: true,
            adena: true,
            aa: true,
            coinLuck: true,
            heroJson: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return { ok: true as const, updated, guildKey };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") {
          return reply.code(409).send({
            error: "revision_conflict",
            currentRevision: txRes.currentRevision ?? 0,
            updatedAt: txRes.updatedAt?.toISOString(),
            serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
          });
        }
        if (txRes.reason === "forbidden") return reply.code(403).send({ error: "forbidden" });
        if (txRes.reason === "invalid_hero_json") {
          return reply.code(400).send({ error: "invalid_hero_json", errors: txRes.errors });
        }
        return reply.code(400).send({ error: "invalid input" });
      }

      const serialized = {
        ...txRes.updated,
        exp: Number(txRes.updated.exp),
        adena: Number(txRes.updated.adena ?? 0),
        aa: Number(txRes.updated.aa ?? 0),
        coinLuck: Number(txRes.updated.coinLuck ?? 0),
      };

      return reply.send({ ok: true, character: serialized, guildKey: txRes.guildKey });
    }
  );

  // POST /characters/:id/learn-skill — серверне вивчення скілу гільдії за SP (whitelist професії, книга для містика)
  app.post(
    "/characters/:id/learn-skill",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id?: string };
      const id = params.id;
      if (!id) return reply.code(400).send({ error: "character id required" });

      const skillId = parseSkillIdFromRequestBody(req.body);
      if (skillId == null) {
        return reply.code(400).send({ error: "invalid input" });
      }

      const body = req.body as { skillId?: unknown; expectedRevision?: number };
      const expectedRevision = Number(body.expectedRevision);
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }

      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; name: string; race: string; classId: string; level: number; sp: number; heroJson: any; updatedAt: Date }>
        >`
          SELECT "id", "name", "race", "classId", "level", "sp", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
        const existing = locked[0];
        const oldHeroJson = (existing.heroJson as any) || {};
        const currentRevision = Number(oldHeroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
            updatedAt: existing.updatedAt,
          };
        }

        const computed = computeProfessionSkillLearn(
          {
            level: existing.level,
            sp: Number(existing.sp ?? 0),
            heroJson: existing.heroJson,
            classId: existing.classId,
          },
          skillId
        );
        if (!computed.ok) {
          return {
            ok: false as const,
            reason: computed.status === 403 ? ("forbidden" as const) : ("invalid_input" as const),
          };
        }

        const mergedBase = {
          name: oldHeroJson.name || existing.name,
          race: oldHeroJson.race || existing.race,
          classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
          klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
          level: oldHeroJson.level ?? existing.level ?? 1,
        };
        const newHeroJsonRaw = {
          ...mergedBase,
          ...oldHeroJson,
          ...computed.mergedHeroJsonRaw,
        };
        const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
        const validation = validateHeroJson(newHeroJson);
        if (!validation.valid) {
          return { ok: false as const, reason: "invalid_hero_json" as const, errors: validation.errors };
        }

        const versionedHeroJson = addVersioning(newHeroJson, currentRevision);

        const updated = await tx.character.update({
          where: { id },
          data: {
            sp: computed.newSp,
            heroJson: versionedHeroJson as any,
            lastActivityAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            race: true,
            classId: true,
            sex: true,
            level: true,
            exp: true,
            sp: true,
            adena: true,
            aa: true,
            coinLuck: true,
            coinsSilver: true,
            heroJson: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return { ok: true as const, updated };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") {
          return reply.code(409).send({
            error: "revision_conflict",
            currentRevision: txRes.currentRevision ?? 0,
            updatedAt: txRes.updatedAt?.toISOString(),
            serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
          });
        }
        if (txRes.reason === "forbidden") return reply.code(403).send({ error: "forbidden" });
        if (txRes.reason === "invalid_hero_json") {
          return reply.code(400).send({ error: "invalid_hero_json", errors: txRes.errors });
        }
        return reply.code(400).send({ error: "invalid input" });
      }

      const serialized = {
        ...txRes.updated,
        exp: Number(txRes.updated.exp),
        adena: Number(txRes.updated.adena ?? 0),
        aa: Number(txRes.updated.aa ?? 0),
        coinLuck: Number(txRes.updated.coinLuck ?? 0),
        coinsSilver: Number((txRes.updated as any).coinsSilver ?? 0),
      };

      return reply.send({ ok: true, character: serialized });
    }
  );

  // POST /characters/:id/learn-additional-skill — додаткові скіли за адену (whitelist)
  app.post(
    "/characters/:id/learn-additional-skill",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id?: string };
      const id = params.id;
      if (!id) return reply.code(400).send({ error: "character id required" });

      const skillId = parseSkillIdFromRequestBody(req.body);
      if (skillId == null) {
        return reply.code(400).send({ error: "invalid input" });
      }

      const body = req.body as { skillId?: unknown; expectedRevision?: number };
      const expectedRevision = Number(body.expectedRevision);
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }

      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; name: string; race: string; classId: string; level: number; adena: bigint; heroJson: any; updatedAt: Date }>
        >`
          SELECT "id", "name", "race", "classId", "level", "adena", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
        const existing = locked[0];
        const oldHeroJson = (existing.heroJson as any) || {};
        const currentRevision = Number(oldHeroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
            updatedAt: existing.updatedAt,
          };
        }

        const computed = computeAdditionalSkillLearn(
          {
            adena: existing.adena ?? 0n,
            level: existing.level,
            heroJson: existing.heroJson,
            classId: existing.classId,
          },
          skillId
        );
        if (!computed.ok) {
          return {
            ok: false as const,
            reason: computed.status === 403 ? ("forbidden" as const) : ("invalid_input" as const),
          };
        }

        const mergedBase = {
          name: oldHeroJson.name || existing.name,
          race: oldHeroJson.race || existing.race,
          classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
          klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
          level: oldHeroJson.level ?? existing.level ?? 1,
        };
        const newHeroJsonRaw = {
          ...mergedBase,
          ...oldHeroJson,
          ...computed.mergedHeroJsonRaw,
        };
        const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
        const validation = validateHeroJson(newHeroJson);
        if (!validation.valid) {
          return { ok: false as const, reason: "invalid_hero_json" as const, errors: validation.errors };
        }

        const versionedHeroJson = addVersioning(newHeroJson, currentRevision);

        const updated = await tx.character.update({
          where: { id },
          data: {
            adena: computed.newAdena,
            heroJson: versionedHeroJson as any,
            lastActivityAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            race: true,
            classId: true,
            sex: true,
            level: true,
            exp: true,
            sp: true,
            adena: true,
            aa: true,
            coinLuck: true,
            coinsSilver: true,
            heroJson: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return { ok: true as const, updated };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") {
          return reply.code(409).send({
            error: "revision_conflict",
            currentRevision: txRes.currentRevision ?? 0,
            updatedAt: txRes.updatedAt?.toISOString(),
            serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
          });
        }
        if (txRes.reason === "forbidden") return reply.code(403).send({ error: "forbidden" });
        if (txRes.reason === "invalid_hero_json") {
          return reply.code(400).send({ error: "invalid_hero_json", errors: txRes.errors });
        }
        return reply.code(400).send({ error: "invalid input" });
      }

      const serialized = {
        ...txRes.updated,
        exp: Number(txRes.updated.exp),
        adena: Number(txRes.updated.adena ?? 0),
        aa: Number(txRes.updated.aa ?? 0),
        coinLuck: Number(txRes.updated.coinLuck ?? 0),
        coinsSilver: Number((txRes.updated as any).coinsSilver ?? 0),
      };

      return reply.send({ ok: true, character: serialized });
    }
  );

  // POST /characters/:id/enchant — server-side atomic enchant (Phase 1)
  app.post("/characters/:id/enchant", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      scrollId?: string;
      slot?: string | null;
      inventoryItemIndex?: number | null;
      /** itemId of the target — сервер верифікує, що item[index].id збігається, щоб уникнути заточки не тієї зброї при розбіжності індексів */
      targetItemId?: string | null;
      expectedRevision?: number;
    };

    const scrollId = String(body.scrollId ?? "").trim();
    if (!scrollId) return reply.code(400).send({ error: "scrollId required" });
    if (body.slot == null && body.inventoryItemIndex == null) {
      return reply.code(400).send({ error: "slot or inventoryItemIndex required" });
    }
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date; name: string }>>`
        SELECT "heroJson", "updatedAt", "name"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

      const row = locked[0];
      const heroJson: any = (row.heroJson as any) || {};
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (currentRevision !== expectedRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }
      const inventory: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];

    // Detect scroll type from ID
    const sid = scrollId.toLowerCase();
    const isWeaponScroll = sid.includes("weapon");
    const isArmorScroll = sid.includes("armor");
    const isBlessedScroll = sid.includes("bless") || sid.includes("quest_shop");
    const isGmGiantScroll = /^gm_giant_enchant_(weapon|armor)_(d|c|b|a|s)$/i.test(scrollId);

    if (!isWeaponScroll && !isArmorScroll) {
      return reply.code(400).send({ error: "unknown scroll type" });
    }

    // Find scroll in inventory
    const scrollIdx = inventory.findIndex(
      (i: any) => i && i.id === scrollId && (i.count ?? 1) > 0
    );
    if (scrollIdx < 0) return reply.code(400).send({ error: "scroll not found in inventory" });

    // Find target item and determine if weapon
    let currentEnchantLevel = 0;
    let isWeaponItem = false;
    let targetIsEquipped = false;
    let targetSlot: string | null = null;
    let targetInventoryIndex: number | null = null;

    if (body.slot) {
      const equipment: any = heroJson.equipment ?? {};
      const equippedId = equipment[body.slot];
      if (!equippedId) return reply.code(400).send({ error: "no item in slot" });

      const enchLevels: any = heroJson.equipmentEnchantLevels ?? {};
      currentEnchantLevel = Number(enchLevels[body.slot] ?? 0);
      targetIsEquipped = true;
      targetSlot = body.slot;
      const weaponSlots = ["weapon", "lrhand", "rhand", "lhand"];
      isWeaponItem = weaponSlots.includes(body.slot);
    } else if (body.inventoryItemIndex != null) {
      const idx = Number(body.inventoryItemIndex);
      if (idx < 0 || idx >= inventory.length) {
        return reply.code(400).send({ error: "invalid inventoryItemIndex" });
      }

      let item = inventory[idx];
      if (!item) return reply.code(400).send({ error: "no item at index" });

      // Verify that the item at the given index matches the expected itemId.
      // If there is a mismatch (client/server inventory order diverged), find the correct item by ID.
      const targetItemId = body.targetItemId
        ? String(body.targetItemId).replace(/^shop_/i, "").toLowerCase()
        : null;
      if (targetItemId) {
        const serverItemId = String(item.id ?? "").replace(/^shop_/i, "").toLowerCase();
        if (serverItemId !== targetItemId) {
          // Wrong item at this index — search for the correct one
          const correctedIdx = inventory.findIndex((it: any) => {
            if (!it) return false;
            const id = String(it.id ?? "").replace(/^shop_/i, "").toLowerCase();
            return id === targetItemId;
          });
          if (correctedIdx < 0) {
            return reply.code(400).send({ error: "target item not found in inventory" });
          }
          item = inventory[correctedIdx];
          targetInventoryIndex = correctedIdx;
        } else {
          targetInventoryIndex = idx;
        }
      } else {
        targetInventoryIndex = idx;
      }

      currentEnchantLevel = Number(item.enchantLevel ?? 0);
      const kind = String(item.kind ?? "").toLowerCase();
      const itemSlot = String(item.slot ?? "").toLowerCase();
      isWeaponItem =
        kind === "weapon" ||
        ["weapon", "lrhand", "rhand", "lhand"].includes(itemSlot);
      if (!isWeaponItem) {
        // Legacy inventory rows may miss kind/slot. Use conservative id-based fallback for weapons.
        const targetId = String(item.id ?? "").replace(/^shop_/i, "").toLowerCase();
        const looksLikeWeaponById =
          /(^|_)(sword|blade|dagger|bow|mace|hammer|blunt|spear|pole|staff|wand|crossbow|rapier|slayer|rod)(_|$)/.test(
            targetId
          ) || targetId === "s_angel_slayer" || targetId === "s_draconic_bow";
        const looksLikeConsumableById =
          targetId.includes("scroll") ||
          targetId.includes("enchant_") ||
          targetId.includes("potion") ||
          targetId.includes("soulshot") ||
          targetId.includes("spiritshot") ||
          targetId.includes("charge_");
        if (looksLikeWeaponById && !looksLikeConsumableById) {
          isWeaponItem = true;
        }
      }
    }

    // Validate scroll type vs item
    if (isWeaponScroll && !isWeaponItem) {
      return reply.code(400).send({ error: "weapon scroll can only enchant weapons" });
    }
    if (isArmorScroll && isWeaponItem) {
      return reply.code(400).send({ error: "armor scroll cannot enchant weapons" });
    }

    const maxEnchant = isWeaponItem ? 40 : 30;
    if (currentEnchantLevel >= maxEnchant) {
      return reply.code(400).send({ error: "item already at max enchant" });
    }

    // Success chance (mirrors enchantScroll.ts client logic)
    let successChance: number;
    if (isWeaponItem) {
      if (isGmGiantScroll) successChance = 1;
      else if (currentEnchantLevel < 5) successChance = 1.0;
      else if (currentEnchantLevel < 15) successChance = 0.8;
      else if (currentEnchantLevel < 30) successChance = 0.7;
      else successChance = 0.6;
    } else {
      if (isGmGiantScroll) successChance = 1;
      else if (currentEnchantLevel < 3) successChance = 1.0;
      else if (currentEnchantLevel < 10) successChance = 0.9;
      else if (currentEnchantLevel < 20) successChance = 0.8;
      else successChance = 0.7;
    }
    if (isBlessedScroll && !isGmGiantScroll) {
      successChance = Math.max(successChance, 0.95);
    }

    const success = Math.random() < successChance;

    // Calculate result level
    let newEnchantLevel: number;
    if (success) {
      newEnchantLevel = currentEnchantLevel + 1;
    } else if (isBlessedScroll) {
      newEnchantLevel = currentEnchantLevel > 3 ? 3 : currentEnchantLevel;
    } else if (isWeaponItem) {
      if (currentEnchantLevel < 5) newEnchantLevel = 0;
      else if (currentEnchantLevel < 15) newEnchantLevel = 5;
      else if (currentEnchantLevel < 30) newEnchantLevel = 10;
      else newEnchantLevel = 15;
    } else {
      newEnchantLevel = currentEnchantLevel;
    }

    // Deep clone heroJson and apply changes
    const newHeroJson: any = JSON.parse(JSON.stringify(heroJson));
    const newInventory: any[] = Array.isArray(newHeroJson.inventory) ? newHeroJson.inventory : [];

    // Consume one scroll (remove or decrement)
    let adjustedTargetIndex = targetInventoryIndex;
    const scrollCount = Number(newInventory[scrollIdx]?.count ?? 1);
    if (scrollCount <= 1) {
      newInventory.splice(scrollIdx, 1);
      if (adjustedTargetIndex != null && scrollIdx < adjustedTargetIndex) {
        adjustedTargetIndex -= 1;
      }
    } else {
      newInventory[scrollIdx] = { ...newInventory[scrollIdx], count: scrollCount - 1 };
    }

    // Apply enchant result
    if (targetIsEquipped && targetSlot) {
      newHeroJson.equipmentEnchantLevels = {
        ...(newHeroJson.equipmentEnchantLevels ?? {}),
        [targetSlot]: newEnchantLevel,
      };
    } else if (
      adjustedTargetIndex != null &&
      adjustedTargetIndex >= 0 &&
      adjustedTargetIndex < newInventory.length
    ) {
      newInventory[adjustedTargetIndex] = {
        ...newInventory[adjustedTargetIndex],
        enchantLevel: newEnchantLevel,
      };
    }
    newHeroJson.inventory = newInventory;

    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

      await tx.character.update({
        where: { id },
        data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
      });

      return {
        ok: true as const,
        success,
        newEnchantLevel,
        targetIsEquipped,
        versionedHeroJson,
        characterName: String(row.name ?? ""),
      };
    });

    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      return reply.code(409).send({
        error: "revision_conflict",
        message: "Character was modified by another session. Please reload and try again.",
        currentRevision: txRes.currentRevision ?? 0,
        updatedAt: txRes.updatedAt?.toISOString(),
        serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
      });
    }

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: txRes.characterName,
      action: "enchant",
      metadata: {
        scrollId,
        slot: body.slot ?? null,
        inventoryItemIndex: body.inventoryItemIndex ?? null,
        success: txRes.success,
        newEnchantLevel: txRes.newEnchantLevel,
        targetIsEquipped: txRes.targetIsEquipped,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, success: txRes.success, newEnchantLevel: txRes.newEnchantLevel, heroJson: txRes.versionedHeroJson });
  });

  // POST /characters/:id/use-buff-scroll — atomic buff scroll application (no client race)
  app.post("/characters/:id/use-buff-scroll", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as { itemId?: string; expectedRevision?: number };
    const itemId = String(body.itemId ?? "").trim();
    if (!itemId) return reply.code(400).send({ error: "itemId required" });
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const { GM_BLESS_SCROLL_EFFECTS, GM_BLESS_SCROLL_DURATION_MS } = await import("../../../data/gmBlessScrollBuffs");
    const buffDef = GM_BLESS_SCROLL_EFFECTS[itemId];
    if (!buffDef) return reply.code(400).send({ error: "unknown buff scroll" });

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date; name: string }>>`
        SELECT "heroJson", "updatedAt", "name"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

      const row = locked[0];
      const heroJson: any = (row.heroJson as any) || {};
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (currentRevision !== expectedRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }
      const inventory: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];

    // Знаходимо скрол в інвентарі (нормалізуємо shop_ префікс)
    const normalizeId = (s: string) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
    const scrollIdx = inventory.findIndex(
      (i: any) => i && normalizeId(String(i.id ?? "")) === normalizeId(itemId) && (i.count ?? 1) > 0
    );
    if (scrollIdx < 0) return reply.code(400).send({ error: "scroll not found in inventory" });

    // Знімаємо 1 скрол
    const scrollRow = inventory[scrollIdx];
    const newCount = (scrollRow.count ?? 1) - 1;
    if (newCount > 0) {
      inventory[scrollIdx] = { ...scrollRow, count: newCount };
    } else {
      inventory.splice(scrollIdx, 1);
    }

    // Будуємо баф
    const now = Date.now();
    const { GM_BLESS_SCROLL_ICON } = await import("../../../data/gmBlessScrollBuffs");
    const newBuff = {
      id: buffDef.buffId,
      name: buffDef.buffName,
      source: "gm_bless_scroll",
      buffGroup: "GM_BLESS_SCROLL",
      icon: buffDef.icon ?? GM_BLESS_SCROLL_ICON,
      effects: buffDef.effects.map((e: any) => ({ ...e })),
      expiresAt: now + GM_BLESS_SCROLL_DURATION_MS,
      startedAt: now,
      durationMs: GM_BLESS_SCROLL_DURATION_MS,
    };

    // Мерджимо бафи: видаляємо дублікат по id, додаємо новий (оновлює тривалість)
    const existingBuffs: any[] = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
    const filtered = existingBuffs.filter(
      (b: any) => !(typeof b?.id === "number" && b.id === newBuff.id)
    );
    const heroBuffs = [newBuff, ...filtered];

      const updatedHeroJson = { ...heroJson, inventory, heroBuffs };
      const versionedHeroJson = addVersioning(updatedHeroJson, currentRevision);

      await tx.character.update({
        where: { id },
        data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
      });

      return { ok: true as const, versionedHeroJson, characterName: String(row.name ?? "") };
    });

    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      return reply.code(409).send({
        error: "revision_conflict",
        message: "Character was modified by another session. Please reload and try again.",
        currentRevision: txRes.currentRevision ?? 0,
        updatedAt: txRes.updatedAt?.toISOString(),
        serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
      });
    }

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: txRes.characterName,
      action: "use_buff_scroll",
      metadata: { itemId, buffName: buffDef.buffName },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, heroJson: txRes.versionedHeroJson });
  });

  // POST /characters/:id/battle-finish — server-authoritative drop calc + battle result save
  app.post("/characters/:id/battle-finish", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      mobId?: string;
      finishNonce?: string;
      expectedRevision?: number;
      /** true = hero used Sweep/Auto Spoil before this kill */
      spoiled?: boolean;
      /** Zone where the mob was killed — used for server-side drop table lookup */
      zoneId?: string;
      earnedExp?: number;
      earnedSp?: number;
      earnedAdena?: number;
      newLevel?: number;
      newExp?: number;
      newSp?: number;
      newAdena?: number;
      newHp?: number;
      newMp?: number;
      newCp?: number;
      heroJsonPatch?: Record<string, any>;
    };

    // Sanity limits
    const MAX_EXP_PER_KILL = 5_000_000;
    const MAX_ADENA_PER_KILL = 500_000;
    const MAX_SP_PER_KILL = 50_000;
    const earnedExp = Math.max(0, Math.min(MAX_EXP_PER_KILL, Number(body.earnedExp ?? 0)));
    const earnedAdena = Math.max(0, Math.min(MAX_ADENA_PER_KILL, Number(body.earnedAdena ?? 0)));
    const earnedSp = Math.max(0, Math.min(MAX_SP_PER_KILL, Number(body.earnedSp ?? 0)));
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{
          heroJson: any;
          level: number;
          exp: bigint;
          sp: number;
          coinLuck: bigint;
          name: string;
          updatedAt: Date;
        }>
      >`
        SELECT "heroJson", "level", "exp", "sp", "coinLuck", "name", "updatedAt"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
      const row = locked[0];
      const character = {
        level: Number(row.level ?? 1),
        exp: Number(row.exp ?? 0n),
        sp: Number(row.sp ?? 0),
        coinLuck: Number(row.coinLuck ?? 0n),
        name: String(row.name ?? ""),
      };

      const heroJson: any = (row.heroJson as any) || {};
      const finishNonce =
        typeof body.finishNonce === "string" ? body.finishNonce.trim().slice(0, 120) : "";
      if (finishNonce && String(heroJson.lastBattleFinishNonce ?? "") === finishNonce) {
        return {
          ok: true as const,
          duplicate: true as const,
          heroJson,
          serverDrops: {
            items: [],
            adena: 0,
            messages: ["duplicate_finish_ignored"],
            questProgressUpdates: [],
            zaricheEquipped: false,
            zaricheEquippedUntil: undefined,
          },
        };
      }
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (currentRevision !== expectedRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }

    // ── Server-side drop calculation ───────────────────────────────────────
    const mobId = String(body.mobId ?? "");
    const zoneId = body.zoneId ? String(body.zoneId) : undefined;

    let serverDropResult: {
      items: any[];
      adena: number;
      messages: string[];
      questProgressUpdates: Array<{ questId: string; itemId: string; count: number }>;
      zaricheEquip?: any;
    } = {
      items: [],
      adena: 0,
      messages: [],
      questProgressUpdates: [],
      zaricheEquip: undefined,
    };
    if (mobId) {
      try {
        serverDropResult = calculateServerDrops(
          mobId,
          zoneId,
          body.spoiled === true,
          {
            level: Number(heroJson.level ?? 1),
            premiumUntil: Number(heroJson.premiumUntil ?? 0),
            profession: String(heroJson.klass ?? heroJson.profession ?? ""),
            inventorySize: Array.isArray(heroJson.inventory) ? heroJson.inventory.length : 0,
            activeQuests: Array.isArray(heroJson.activeQuests) ? heroJson.activeQuests : [],
            inventory: Array.isArray(heroJson.inventory) ? heroJson.inventory : [],
            equipment: (heroJson.equipment as Record<string, string | null>) ?? {},
            equipmentEnchantLevels: (heroJson.equipmentEnchantLevels as Record<string, number>) ?? {},
          }
        );
      } catch {
        // Drop calculation failure is non-fatal; continue without drops
      }
    }

    // ── Build updated heroJson ─────────────────────────────────────────────
    const newHeroJson: any = { ...heroJson };

    // Server-authoritative progression: ignore client newLevel/newExp/newSp.
    const baseline = pickBestLevelExpPair(character.level, character.exp, heroJson.level, heroJson.exp);
    const afterKill = applyLevelUpsInPlace(baseline.level, baseline.exp + earnedExp);
    newHeroJson.level = afterKill.level;
    newHeroJson.exp = afterKill.exp;
    newHeroJson.sp = Math.max(0, Number(heroJson.sp ?? character.sp ?? 0)) + earnedSp;

    // HP/MP/CP are accepted only as clamped resource snapshots.
    const maxHp = Math.max(1, Number(heroJson.maxHp ?? 1) || 1);
    const maxMp = Math.max(1, Number(heroJson.maxMp ?? 1) || 1);
    const maxCp = Math.max(1, Number(heroJson.maxCp ?? 1) || 1);
    if (body.newHp != null) newHeroJson.hp = Math.max(0, Math.min(maxHp, Math.floor(Number(body.newHp) || 0)));
    if (body.newMp != null) newHeroJson.mp = Math.max(0, Math.min(maxMp, Math.floor(Number(body.newMp) || 0)));
    if (body.newCp != null) newHeroJson.cp = Math.max(0, Math.min(maxCp, Math.floor(Number(body.newCp) || 0)));

    // Adena is server-authoritative: from server drop calculator, not client payload.
    const serverAdenaReward = Math.max(0, Math.floor(Number(serverDropResult.adena ?? 0)));
    newHeroJson.adena = Number(heroJson.adena ?? 0) + serverAdenaReward;

    // Patch only a strict allowlist with basic shape guards.
    // Security: daily quest progression/completion is server-authoritative and must not be set directly by client payload.
    let didAdvanceKillCounter = true;
    if (body.heroJsonPatch && typeof body.heroJsonPatch === "object") {
      const patch = body.heroJsonPatch as Record<string, any>;
      if (patch.mobsKilled != null) {
        const current = Math.max(0, Math.floor(Number(newHeroJson.mobsKilled ?? 0)));
        const incoming = Math.max(0, Math.floor(Number(patch.mobsKilled)));
        // One battle-finish call may advance mobsKilled by at most +1.
        const clampedIncoming = Math.min(current + 1, incoming);
        const next = Math.max(current, clampedIncoming);
        didAdvanceKillCounter = next > current;
        newHeroJson.mobsKilled = next;
      } else {
        const current = Math.max(0, Math.floor(Number(newHeroJson.mobsKilled ?? 0)));
        newHeroJson.mobsKilled = current + 1;
        didAdvanceKillCounter = true;
      }
      if (typeof patch.lastKillMobId === "string") newHeroJson.lastKillMobId = patch.lastKillMobId.slice(0, 100);
      if (typeof patch.lastKillMobName === "string") newHeroJson.lastKillMobName = patch.lastKillMobName.slice(0, 200);
      if (typeof patch.lastKillZoneId === "string") newHeroJson.lastKillZoneId = patch.lastKillZoneId.slice(0, 100);
      if (typeof patch.lastKillZoneName === "string") newHeroJson.lastKillZoneName = patch.lastKillZoneName.slice(0, 120);
      if (typeof patch.battleZoneId === "string") newHeroJson.battleZoneId = patch.battleZoneId.slice(0, 100);
      if (typeof patch.zoneId === "string") newHeroJson.zoneId = patch.zoneId.slice(0, 100);
    } else {
      const current = Math.max(0, Math.floor(Number(newHeroJson.mobsKilled ?? 0)));
      newHeroJson.mobsKilled = current + 1;
      didAdvanceKillCounter = true;
    }

    // Server-authoritative daily quests for battle-related metrics.
    const DAILY_KILLS_TARGET = 1000;
    const DAILY_KILLS_REWARD_ADENA = 150000;
    const DAILY_KILLS_REWARD_COIN_LUCK = 1;
    const DAILY_ADENA_TARGET = 100000;
    const DAILY_ADENA_REWARD_SP = 50000;
    const DAILY_ADENA_REWARD_ADENA = 100000;
    const DAILY_ADENA_REWARD_COIN_LUCK = 1;
    const dailyProgress =
      newHeroJson.dailyQuestsProgress && typeof newHeroJson.dailyQuestsProgress === "object" && !Array.isArray(newHeroJson.dailyQuestsProgress)
        ? { ...(newHeroJson.dailyQuestsProgress as Record<string, number>) }
        : {};
    const completedSet = new Set<string>(
      Array.isArray(newHeroJson.dailyQuestsCompleted) ? newHeroJson.dailyQuestsCompleted.map((x: any) => String(x)) : []
    );
    if (didAdvanceKillCounter && !completedSet.has("daily_kills")) {
      const prev = Math.max(0, Math.floor(Number((dailyProgress as any).daily_kills ?? 0)));
      (dailyProgress as any).daily_kills = prev + 1;
    }
    if (didAdvanceKillCounter && !completedSet.has("daily_adena_farm")) {
      const prev = Math.max(0, Math.floor(Number((dailyProgress as any).daily_adena_farm ?? 0)));
      (dailyProgress as any).daily_adena_farm = prev + serverAdenaReward;
    }
    let dailyRewardAdena = 0;
    let dailyRewardSp = 0;
    let dailyRewardCoinLuck = 0;
    const killsProgress = Math.max(0, Math.floor(Number((dailyProgress as any).daily_kills ?? 0)));
    if (killsProgress >= DAILY_KILLS_TARGET && !completedSet.has("daily_kills")) {
      completedSet.add("daily_kills");
      dailyRewardAdena += DAILY_KILLS_REWARD_ADENA;
      dailyRewardCoinLuck += DAILY_KILLS_REWARD_COIN_LUCK;
    }
    const adenaFarmProgress = Math.max(0, Math.floor(Number((dailyProgress as any).daily_adena_farm ?? 0)));
    if (adenaFarmProgress >= DAILY_ADENA_TARGET && !completedSet.has("daily_adena_farm")) {
      completedSet.add("daily_adena_farm");
      dailyRewardSp += DAILY_ADENA_REWARD_SP;
      dailyRewardAdena += DAILY_ADENA_REWARD_ADENA;
      dailyRewardCoinLuck += DAILY_ADENA_REWARD_COIN_LUCK;
    }
    newHeroJson.dailyQuestsProgress = dailyProgress;
    newHeroJson.dailyQuestsCompleted = Array.from(completedSet).slice(0, 200);
    if (dailyRewardSp > 0) {
      newHeroJson.sp = Math.max(0, Math.floor(Number(newHeroJson.sp ?? 0))) + dailyRewardSp;
    }
    if (dailyRewardAdena > 0) {
      newHeroJson.adena = Math.max(0, Math.floor(Number(newHeroJson.adena ?? 0))) + dailyRewardAdena;
    }
    const currentCoinLuck = Math.max(
      0,
      Math.floor(Number(newHeroJson.coinOfLuck ?? heroJson.coinOfLuck ?? character.coinLuck ?? 0))
    );
    if (dailyRewardCoinLuck > 0) {
      newHeroJson.coinOfLuck = currentCoinLuck + dailyRewardCoinLuck;
    } else {
      newHeroJson.coinOfLuck = currentCoinLuck;
    }
    if (finishNonce) {
      newHeroJson.lastBattleFinishNonce = finishNonce;
      newHeroJson.lastBattleFinishAt = Date.now();
    }

    // ── Apply zariche auto-equip ───────────────────────────────────────────
    if (serverDropResult.zaricheEquip) {
      const ze = serverDropResult.zaricheEquip;
      newHeroJson.equipment = ze.equipment;
      newHeroJson.equipmentEnchantLevels = ze.equipmentEnchantLevels;
      newHeroJson.zaricheEquippedUntil = ze.zaricheEquippedUntil;
    }

    // ── Apply server-calculated quest progress updates ────────────────────
    if (serverDropResult.questProgressUpdates.length > 0) {
      const baseActiveQuests: any[] = Array.isArray(newHeroJson.activeQuests)
        ? newHeroJson.activeQuests
        : [];
      const updatedActiveQuests = baseActiveQuests.map((aq: any) => {
        const updates = serverDropResult.questProgressUpdates.filter(
          (u) => u.questId === aq.questId
        );
        if (updates.length === 0) return aq;
        const newProgress = { ...(aq.progress ?? {}) };
        for (const u of updates) {
          newProgress[u.itemId] = (newProgress[u.itemId] ?? 0) + u.count;
        }
        return { ...aq, progress: newProgress };
      });
      newHeroJson.activeQuests = updatedActiveQuests;
    }

    // ── Add server drops to inventory ─────────────────────────────────────
    const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
    const overflowChest: any[] = Array.isArray(heroJson.overflowChest)
      ? [...heroJson.overflowChest]
      : [];
    const MAX_INVENTORY = 200;

    // If zariche dropped, returned old weapon goes to inventory first
    const zaricheReturnedWeapon = serverDropResult.zaricheEquip?.returnedWeapon;
    const allDropsToAdd: any[] = [
      ...(zaricheReturnedWeapon ? [zaricheReturnedWeapon] : []),
      ...serverDropResult.items.filter((i: any) => i.id !== "zariche"), // zariche handled via equip
    ];

    function addDropToInventory(drop: any): void {
      if (!drop.id) return;
      const itemId = String(drop.id).trim();
      const count = Math.max(1, Math.floor(Number(drop.count ?? 1)));
      if (!itemId) return;

      // Equipment pieces (weapons, armor, jewelry) are never stackable — each is its own row.
      // Everything else (resources, consumables, quest items, unknown) stacks by default.
      const EQUIP_KINDS = new Set(["equipment", "weapon", "armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"]);
      const EQUIP_SLOTS = new Set(["weapon", "armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"]);
      const dropKind = String(drop.kind ?? "").toLowerCase();
      const dropSlot = String(drop.slot ?? "").toLowerCase();
      const isStackable = !EQUIP_KINDS.has(dropKind) && !EQUIP_SLOTS.has(dropSlot);

      const existingIdx = isStackable
        ? inventory.findIndex((i: any) => i && i.id === itemId && !(i?.meta?.hasLSPassive))
        : -1;

      if (existingIdx >= 0) {
        inventory[existingIdx] = {
          ...inventory[existingIdx],
          count: (inventory[existingIdx].count ?? 0) + count,
        };
      } else if (inventory.length < MAX_INVENTORY) {
        inventory.push({ ...drop, id: itemId, count });
      } else {
        const ovIdx = overflowChest.findIndex((i: any) => i && i.id === itemId);
        if (ovIdx >= 0) {
          overflowChest[ovIdx] = {
            ...overflowChest[ovIdx],
            count: (overflowChest[ovIdx].count ?? 0) + count,
          };
        } else {
          overflowChest.push({ ...drop, id: itemId, count });
        }
      }
    }

    for (const drop of allDropsToAdd) {
      addDropToInventory(drop);
    }

    // Дедублікація: злиття фрагментованих стакових записів (кілька рядків з однаковим id та count=1)
    // що виникли до введення стакування. Виконується після кожного battle-finish.
    function deduplicateStackableInventory(inv: any[]): any[] {
      // "equipment" — загальний kind з drop-таблиць; має бути тут поряд з конкретними слотами
      const EQUIP_K = new Set(["equipment","weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak","lhand","rhand","lrhand"]);
      const result: any[] = [];
      const seenIdx = new Map<string, number>(); // id -> index in result
      for (const item of inv) {
        if (!item?.id) { result.push(item); continue; }
        const id = String(item.id).trim();
        const kind = String(item.kind ?? "").toLowerCase();
        const slot = String(item.slot ?? "").toLowerCase();
        const stackable = !(item?.meta?.hasLSPassive) && !EQUIP_K.has(kind) && !EQUIP_K.has(slot);
        if (!stackable) { result.push(item); continue; }
        const existing = seenIdx.get(id);
        if (existing !== undefined) {
          result[existing] = { ...result[existing], count: (result[existing].count ?? 1) + (item.count ?? 1) };
        } else {
          seenIdx.set(id, result.length);
          result.push({ ...item });
        }
      }
      return result;
    }

    // Видаляємо з інвентаря ВСІ копії предметів, що ВЖЕ одягнені (щоб не виникали дублікати екіпу в сумці)
    // Примітка: "equipment" — загальний kind від drop-таблиць; включаємо у перевірку разом з конкретними слотами.
    const equippedIds = new Set<string>();
    const equip = newHeroJson.equipment as Record<string, string | null> | undefined;
    if (equip) {
      Object.values(equip).forEach((v) => { if (v) equippedIds.add(String(v).replace(/^shop_/i, "").toLowerCase()); });
    }
    const EQUIP_KINDS_FILTER = new Set(["equipment","weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak"]);
    const filteredInv: any[] = [];
    for (const item of inventory) {
      if (!item?.id) { filteredInv.push(item); continue; }
      const baseId = String(item.id).replace(/^shop_/i, "").toLowerCase();
      const kind = String(item.kind ?? "").toLowerCase();
      const slot = String(item.slot ?? "").toLowerCase();
      const isEquipKind = EQUIP_KINDS_FILTER.has(kind) || EQUIP_KINDS_FILTER.has(slot);
      const isEquipped = equippedIds.has(baseId);
      const isLSPassive = !!(item?.meta?.hasLSPassive);
      // Видаляємо ВСІ копії одягненого предмета (не тільки першу) без LS-пасиву
      if (isEquipped && isEquipKind && !isLSPassive) {
        continue; // пропускаємо — видаляємо дублікат
      }
      filteredInv.push(item);
    }

    newHeroJson.inventory = deduplicateStackableInventory(filteredInv);
    newHeroJson.overflowChest = deduplicateStackableInventory(overflowChest);

    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    const updateData: any = {
      heroJson: versionedHeroJson as any,
      lastActivityAt: new Date(),
    };
    updateData.adena = BigInt(Math.max(0, Math.floor(Number(newHeroJson.adena))));
    updateData.sp = Math.max(0, Math.floor(Number(newHeroJson.sp ?? character.sp ?? 0)));
    updateData.coinLuck = BigInt(Math.max(0, Math.floor(Number(newHeroJson.coinOfLuck ?? character.coinLuck ?? 0))));

      await tx.character.update({
        where: { id },
        data: updateData,
      });

      return {
        ok: true as const,
        duplicate: false as const,
        heroJson: versionedHeroJson,
        serverDrops: {
          items: serverDropResult.items,
          adena: serverDropResult.adena,
          messages: serverDropResult.messages,
          questProgressUpdates: serverDropResult.questProgressUpdates,
          zaricheEquipped: !!serverDropResult.zaricheEquip,
          zaricheEquippedUntil: serverDropResult.zaricheEquip?.zaricheEquippedUntil,
        },
        activity: {
          characterName: String(heroJson.name ?? character.name ?? ""),
          mobId: mobId || null,
          earnedExp,
          earnedSp,
          earnedAdena: serverAdenaReward,
          newLevel: newHeroJson.level ?? null,
          serverDrops: serverDropResult.items.length,
          serverDropAdena: serverDropResult.adena,
          questDrops: serverDropResult.questProgressUpdates.length,
          zaricheEquipped: !!serverDropResult.zaricheEquip,
        },
      };
    });

    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      return reply.code(409).send({
        error: "revision_conflict",
        message: "Character was modified by another session. Please reload and try again.",
        currentRevision: txRes.currentRevision ?? 0,
        updatedAt: txRes.updatedAt?.toISOString(),
        serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
      });
    }

    if (!txRes.duplicate) {
      enqueuePlayerActivityLog({
        accountId: auth.accountId,
        characterId: id,
        characterName: txRes.activity.characterName,
        action: "battle.finish",
        metadata: {
          mobId: txRes.activity.mobId,
          earnedExp: txRes.activity.earnedExp,
          earnedSp: txRes.activity.earnedSp,
          earnedAdena: txRes.activity.earnedAdena,
          newLevel: txRes.activity.newLevel,
          serverDrops: txRes.activity.serverDrops,
          serverDropAdena: txRes.activity.serverDropAdena,
          questDrops: txRes.activity.questDrops,
          zaricheEquipped: txRes.activity.zaricheEquipped,
        },
        clientIp: getClientIp(req),
      });
    }

    return reply.send({
      ok: true,
      heroJson: txRes.heroJson,
      serverDrops: txRes.serverDrops,
    });
  });

  // POST /characters/:id/equip-commit — atomic equip state save (Phase 2)
  // Client calculates new equip state, server saves it atomically
  app.post("/characters/:id/equip-commit", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      equipment?: Record<string, any>;
      inventory?: any[];
      equipmentEnchantLevels?: Record<string, number>;
      expectedRevision?: number;
    };

    if (!body.equipment || !body.inventory) {
      return reply.code(400).send({ error: "equipment and inventory required" });
    }
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date; name: string }>>`
        SELECT "heroJson", "updatedAt", "name"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

      const row = locked[0];
      const heroJson: any = (row.heroJson as any) || {};
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (currentRevision !== expectedRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }

      const oldInventory: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
      const oldEquipment: Record<string, any> = heroJson.equipment ?? {};
      const oldEnchantBySlot: Record<string, number> = heroJson.equipmentEnchantLevels ?? {};

      const normId = (v: any) => String(v ?? "").replace(/^shop_/i, "").toLowerCase();
      const bodyEquipment = body.equipment ?? {};
      const bodyInventory = Array.isArray(body.inventory) ? body.inventory : [];
      const bodyEnchantBySlot: Record<string, number> = body.equipmentEnchantLevels ?? {};

      const allowedIds = new Set<string>();
      const allowedCountById = new Map<string, number>();
      const maxEnchantById = new Map<string, number>();
      const incCount = (itemId: string, delta: number) => {
        allowedCountById.set(itemId, Math.max(0, (allowedCountById.get(itemId) ?? 0) + delta));
      };

      for (const it of oldInventory) {
        if (!it?.id) continue;
        const itemId = normId(it.id);
        if (!itemId) continue;
        allowedIds.add(itemId);
        incCount(itemId, Math.max(1, Number(it.count ?? 1) || 1));
        maxEnchantById.set(itemId, Math.max(maxEnchantById.get(itemId) ?? 0, Math.max(0, Number(it.enchantLevel ?? 0) || 0)));
      }
      for (const [slot, itemIdRaw] of Object.entries(oldEquipment)) {
        if (!itemIdRaw) continue;
        const itemId = normId(itemIdRaw);
        if (!itemId) continue;
        allowedIds.add(itemId);
        incCount(itemId, 1);
        maxEnchantById.set(itemId, Math.max(maxEnchantById.get(itemId) ?? 0, Math.max(0, Number(oldEnchantBySlot[slot] ?? 0) || 0)));
      }

      for (const itemIdRaw of Object.values(bodyEquipment)) {
        if (!itemIdRaw) continue;
        const itemId = normId(itemIdRaw);
        if (!allowedIds.has(itemId)) return { ok: false as const, reason: "invalid_commit" as const };
      }

      const requestedInvCountById = new Map<string, number>();
      for (const it of bodyInventory) {
        if (!it?.id) continue;
        const itemId = normId(it.id);
        const c = Math.max(1, Number(it.count ?? 1) || 1);
        requestedInvCountById.set(itemId, (requestedInvCountById.get(itemId) ?? 0) + c);
        if (!allowedIds.has(itemId)) return { ok: false as const, reason: "invalid_commit" as const };
        const maxEnchant = maxEnchantById.get(itemId) ?? 0;
        const requestedEnchant = Math.max(0, Number(it.enchantLevel ?? 0) || 0);
        if (requestedEnchant > maxEnchant) return { ok: false as const, reason: "invalid_commit" as const };
      }
      for (const [itemId, count] of requestedInvCountById.entries()) {
        if (count > (allowedCountById.get(itemId) ?? 0)) return { ok: false as const, reason: "invalid_commit" as const };
      }
      for (const [slot, itemIdRaw] of Object.entries(bodyEquipment)) {
        if (!itemIdRaw) continue;
        const itemId = normId(itemIdRaw);
        const maxEnchant = maxEnchantById.get(itemId) ?? 0;
        const requestedEnchant = Math.max(0, Number(bodyEnchantBySlot[slot] ?? 0) || 0);
        if (requestedEnchant > maxEnchant) return { ok: false as const, reason: "invalid_commit" as const };
      }

      // Серверна очистка: видалити з inventory ВСІ рядки, id яких є в equipment
      const normEquipId = (s: any) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
      const equippedNormIds = new Set(
        Object.values(body.equipment ?? {})
          .filter(Boolean)
          .map((v: any) => normEquipId(String(v)))
      );
      const cleanedInventory = (body.inventory ?? []).filter((item: any) => {
        if (!item?.id) return true;
        const itemId = normEquipId(String(item.id));
        return !equippedNormIds.has(itemId);
      });

      const newHeroJson: any = {
        ...heroJson,
        equipment: body.equipment,
        inventory: cleanedInventory,
        equipmentEnchantLevels: body.equipmentEnchantLevels ?? heroJson.equipmentEnchantLevels ?? {},
      };
      const versionedHeroJson = addVersioning(newHeroJson, currentRevision);
      await tx.character.update({
        where: { id },
        data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
      });
      return {
        ok: true as const,
        versionedHeroJson,
        characterName: String(row.name ?? ""),
      };
    });

    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "revision_conflict") {
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: txRes.currentRevision ?? 0,
          updatedAt: txRes.updatedAt?.toISOString(),
          serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
        });
      }
      return reply.code(400).send({ error: "invalid equipment commit" });
    }

    // Count equipped slots for logging
    const equippedSlots = Object.entries(body.equipment ?? {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);
    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: txRes.characterName,
      action: "equip.commit",
      metadata: {
        equippedSlots,
        inventoryLen: Array.isArray(body.inventory) ? body.inventory.length : 0,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, heroJson: txRes.versionedHeroJson });
  });

  // POST /characters/:id/shop/buy — server-side authoritative shop purchase (GM/regular/quest)
  app.post("/characters/:id/shop/buy", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      itemId?: string;
      quantity?: number;
      shopType?: "gm" | "regular" | "quest";
      itemMeta?: Record<string, any>;
      expectedRevision?: number;
    };

    const itemIdRaw = String(body.itemId ?? "").trim();
    const normalizedItemId = normalizeShopItemId(itemIdRaw);
    const shopType = body.shopType ?? "gm";
    const quantity = Math.max(1, Math.floor(Number(body.quantity ?? 1)));
    const expectedRevision =
      body.expectedRevision !== undefined ? Number(body.expectedRevision) : undefined;

    if (!normalizedItemId) return reply.code(400).send({ error: "itemId required" });
    if (expectedRevision === undefined || !Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 30000) {
      return reply.code(400).send({ error: "invalid input" });
    }

    let unitPrice = 0;
    let currency: "adena" | "ancient_adena" | "coins_silver";
    let stackable = true;
    let canonicalItemId = normalizedItemId;
    let canonicalMeta: Record<string, any> = {};

    if (shopType === "gm") {
      const { getGmShopItemPrice } = await import("../../../data/gmShopCatalog");
      const gm = getGmShopItemPrice(normalizedItemId);
      if (!gm) return reply.code(400).send({ error: "item not available in shop" });
      unitPrice = gm.unitPrice;
      currency = gm.currency === "ancient_adena" ? "ancient_adena" : "adena";
      canonicalMeta = sanitizeClientItemMeta(body.itemMeta);
      canonicalMeta.id = normalizedItemId;
    } else {
      const bucket = shopType === "regular" ? serverShopCatalog.regular : serverShopCatalog.quest;
      const entry = bucket?.[normalizedItemId];
      if (!entry) return reply.code(400).send({ error: "item not available in shop" });
      unitPrice = Math.max(0, Number(entry.unitPrice) || 0);
      currency = entry.currency === "coins_silver" ? "coins_silver" : "adena";
      stackable = entry.stackable !== false;
      canonicalItemId = String(entry.itemMeta?.id || normalizedItemId);
      canonicalMeta = {
        id: canonicalItemId,
        name: String(entry.itemMeta?.name ?? canonicalItemId),
        slot: entry.itemMeta?.slot,
        kind: entry.itemMeta?.kind,
        icon: entry.itemMeta?.icon,
        description: entry.itemMeta?.description,
        grade: entry.itemMeta?.grade,
        armorType: entry.itemMeta?.armorType,
      };
    }
    const totalPrice = Math.max(0, unitPrice * quantity);

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{ heroJson: any; adena: bigint; coinsSilver: bigint; updatedAt: Date }>
      >`
        SELECT "heroJson", "adena", "coinsSilver", "updatedAt"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

      const row = locked[0];
      const heroJson = (row.heroJson as any) || {};
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (expectedRevision !== currentRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const overflowChest: any[] = Array.isArray(heroJson.overflowChest) ? [...heroJson.overflowChest] : [];
      const MAX_INVENTORY = 200;

      let nextAdena = Number(row.adena ?? 0n);
      let nextCoinsSilver = Number(row.coinsSilver ?? 0n);

      if (currency === "adena") {
        if (nextAdena < totalPrice) return { ok: false as const, reason: "insufficient_adena" as const };
        nextAdena -= totalPrice;
      } else if (currency === "coins_silver") {
        if (nextCoinsSilver < totalPrice) return { ok: false as const, reason: "insufficient_silver" as const };
        nextCoinsSilver -= totalPrice;
      } else if (currency === "ancient_adena") {
        const aaIdx = inventory.findIndex((i: any) => normalizeShopItemId(i?.id) === "ancient_adena");
        const aaCount = Number(inventory[aaIdx]?.count ?? 0);
        if (aaCount < totalPrice) return { ok: false as const, reason: "insufficient_aa" as const };
        const left = aaCount - totalPrice;
        if (left <= 0) inventory.splice(aaIdx, 1);
        else inventory[aaIdx] = { ...inventory[aaIdx], count: left };
      }

      const addOne = (rowItem: any) => {
        if (!stackable) {
          if (inventory.length < MAX_INVENTORY) inventory.push({ ...rowItem, count: 1 });
          else overflowChest.push({ ...rowItem, count: 1 });
          return;
        }
        const idx = inventory.findIndex((i: any) => normalizeShopItemId(i?.id) === normalizeShopItemId(rowItem.id));
        if (idx >= 0) {
          inventory[idx] = { ...inventory[idx], count: Number(inventory[idx].count ?? 0) + 1 };
          return;
        }
        if (inventory.length < MAX_INVENTORY) {
          inventory.push({ ...rowItem, count: 1 });
          return;
        }
        const ovIdx = overflowChest.findIndex((i: any) => normalizeShopItemId(i?.id) === normalizeShopItemId(rowItem.id));
        if (ovIdx >= 0) overflowChest[ovIdx] = { ...overflowChest[ovIdx], count: Number(overflowChest[ovIdx].count ?? 0) + 1 };
        else overflowChest.push({ ...rowItem, count: 1 });
      };
      const collapseStackRowsById = (rows: any[], itemId: string): any[] => {
        const normTarget = normalizeShopItemId(itemId);
        let total = 0;
        let template: any | null = null;
        const kept: any[] = [];
        for (const rowItem of rows) {
          if (normalizeShopItemId(rowItem?.id) === normTarget) {
            const rowCount = Math.max(1, Math.floor(Number(rowItem?.count ?? 1) || 1));
            total += rowCount;
            if (!template) template = rowItem;
            continue;
          }
          kept.push(rowItem);
        }
        if (total > 0) {
          kept.push({
            ...(template ?? {}),
            ...canonicalMeta,
            id: canonicalItemId,
            count: total,
          });
        }
        return kept;
      };
      const basePurchasedRow = {
        id: canonicalItemId,
        ...canonicalMeta,
      };
      for (let i = 0; i < quantity; i++) addOne(basePurchasedRow);
      if (stackable) {
        // Keep exactly one stack row per id in each container to avoid fragmented stacks from legacy snapshots.
        const collapsedInventory = collapseStackRowsById(inventory, canonicalItemId);
        const collapsedOverflow = collapseStackRowsById(overflowChest, canonicalItemId);
        inventory.length = 0;
        inventory.push(...collapsedInventory);
        overflowChest.length = 0;
        overflowChest.push(...collapsedOverflow);
      }

      const newHeroJson = {
        ...heroJson,
        inventory,
        overflowChest,
      };
      const versionedHeroJson = addVersioning(newHeroJson, currentRevision);
      const updateData: any = {
        heroJson: versionedHeroJson as any,
        lastActivityAt: new Date(),
      };
      if (currency === "adena") updateData.adena = BigInt(Math.max(0, Math.floor(nextAdena)));
      if (currency === "coins_silver") updateData.coinsSilver = Math.max(0, Math.floor(nextCoinsSilver));

      const updated = await tx.character.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          adena: true,
          coinsSilver: true,
          heroJson: true,
        },
      });
      return { ok: true as const, updated, unitPrice, currency, totalPrice };
    });
    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "revision_conflict") {
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: txRes.currentRevision ?? 0,
          updatedAt: txRes.updatedAt?.toISOString(),
          serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
        });
      }
      if (txRes.reason === "insufficient_adena") return reply.code(400).send({ error: "insufficient adena" });
      if (txRes.reason === "insufficient_silver") return reply.code(400).send({ error: "insufficient silver coins" });
      if (txRes.reason === "insufficient_aa") return reply.code(400).send({ error: "insufficient ancient adena" });
      return reply.code(400).send({ error: "invalid input" });
    }

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String((txRes.updated.heroJson as any)?.name ?? ""),
      action: "shop.buy",
      metadata: {
        itemId: canonicalItemId,
        shopType,
        quantity,
        currency,
        unitPrice,
        totalPrice,
      },
      clientIp: getClientIp(req),
    });
    return reply.send({
      ok: true,
      heroJson: txRes.updated.heroJson,
      adena: Number((txRes.updated as any)?.adena ?? 0),
      coinsSilver: Number((txRes.updated as any)?.coinsSilver ?? 0),
    });
  });

  // POST /characters/:id/pickup-item — server-side atomic inventory add
  // Used for: battle drops, quest rewards, mail attachments, any atomic item grant.
  app.post("/characters/:id/pickup-item", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      /** Items to add to inventory */
      items: Array<{
        id: string;
        count?: number;
        name?: string;
        kind?: string;
        slot?: string;
        icon?: string;
        grade?: string;
        enchantLevel?: number;
        [key: string]: any;
      }>;
      /** Optional: source for logging (battle, quest, mail, etc.) */
      source?: string;
      expectedRevision?: number;
    };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return reply.code(400).send({ error: "items array required" });
    }
    // Sanity: max 50 items per request
    if (body.items.length > 50) {
      return reply.code(400).send({ error: "too many items (max 50)" });
    }
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ heroJson: any; name: string; updatedAt: Date }>>`
        SELECT "heroJson", "name", "updatedAt"
        FROM "Character"
        WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
      const row = locked[0];
      const heroJson: any = (row.heroJson as any) || {};
      const currentRevision = Number(heroJson.heroRevision ?? 0);
      if (currentRevision !== expectedRevision) {
        return {
          ok: false as const,
          reason: "revision_conflict" as const,
          currentRevision,
          updatedAt: row.updatedAt,
        };
      }

      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const MAX_INVENTORY = 200;
      const addedItems: string[] = [];
      const overflowItems: any[] = Array.isArray(heroJson.overflowChest)
        ? [...heroJson.overflowChest]
        : [];

      for (const item of body.items) {
        if (!item.id) continue;
        const itemId = String(item.id).trim();
        const count = Math.max(1, Math.floor(Number(item.count ?? 1)));
        if (!itemId) continue;

        const EQUIP_KINDS_PU = new Set(["weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak"]);
        const isStackable =
          !(item as any).meta?.hasLSPassive &&
          !EQUIP_KINDS_PU.has(String(item.kind ?? "").toLowerCase()) &&
          !EQUIP_KINDS_PU.has(String(item.slot ?? "").toLowerCase());

        const normPickupId = (s: string) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
        const existingIdx = isStackable
          ? inventory.findIndex((i: any) => i && normPickupId(String(i.id ?? "")) === normPickupId(itemId) && !(i?.meta?.hasLSPassive))
          : -1;

        if (existingIdx >= 0 && isStackable) {
          inventory[existingIdx] = {
            ...inventory[existingIdx],
            count: (inventory[existingIdx].count ?? 0) + count,
          };
          addedItems.push(itemId);
        } else if (inventory.length < MAX_INVENTORY) {
          inventory.push({ ...item, id: itemId, count });
          addedItems.push(itemId);
        } else {
          const ovIdx = overflowItems.findIndex((i: any) => i && normPickupId(String(i.id ?? "")) === normPickupId(itemId));
          if (ovIdx >= 0) {
            overflowItems[ovIdx] = {
              ...overflowItems[ovIdx],
              count: (overflowItems[ovIdx].count ?? 0) + count,
            };
          } else {
            overflowItems.push({ ...item, id: itemId, count });
          }
        }
      }

      const newHeroJson: any = { ...heroJson, inventory, overflowChest: overflowItems };
      const versionedHeroJson = addVersioning(newHeroJson, currentRevision);
      await tx.character.update({
        where: { id },
        data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
      });

      return {
        ok: true as const,
        heroJson: versionedHeroJson,
        characterName: String(row.name ?? ""),
        addedItems,
        overflowCount:
          overflowItems.length - (Array.isArray(heroJson.overflowChest) ? heroJson.overflowChest.length : 0),
      };
    });

    if (!txRes.ok) {
      if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
      return reply.code(409).send({
        error: "revision_conflict",
        message: "Character was modified by another session. Please reload and try again.",
        currentRevision: txRes.currentRevision ?? 0,
        updatedAt: txRes.updatedAt?.toISOString(),
        serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
      });
    }

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: txRes.characterName,
      action: `pickup.${body.source ?? "unknown"}`,
      metadata: {
        itemCount: body.items.length,
        addedItems: txRes.addedItems.slice(0, 20),
        overflowCount: txRes.overflowCount,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, heroJson: txRes.heroJson });
  });
}