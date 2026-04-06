import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";
import { clampHeroSkillsToPlayerLevel } from "../clampHeroSkillsToLevel";
import { prisma } from "../db";
import { setMuted } from "../chatMute";
import { writeAdminAuditLog } from "../adminAudit";
import { addVersioning } from "../heroJsonValidator";
import { maxEnchantForInventoryRow } from "../adminInventoryEnchant";

function getAdminLogin(req: any): string {
  return String(req?.admin?.login || "unknown");
}

async function logAdminSuccess(
  req: any,
  action: string,
  payload: {
    targetCharacterId?: string | null;
    targetCharacterName?: string | null;
    before?: unknown;
    after?: unknown;
    message?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  await writeAdminAuditLog({
    req,
    adminLogin: getAdminLogin(req),
    action,
    status: "success",
    ...payload,
  });
}

async function logAdminFailed(
  req: any,
  action: string,
  payload: {
    targetCharacterId?: string | null;
    targetCharacterName?: string | null;
    before?: unknown;
    after?: unknown;
    message?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  await writeAdminAuditLog({
    req,
    adminLogin: getAdminLogin(req),
    action,
    status: "failed",
    ...payload,
  });
}

/** Тіло з адмінки інколи дає set/delta рядком; раніше `typeof x === "number"` ігнорував зміну. */
function parseAdminCurrencyDeltaOrSet(body: unknown):
  | { ok: true; mode: "set"; value: number }
  | { ok: true; mode: "delta"; value: number }
  | { ok: false; error: string } {
  if (body == null || typeof body !== "object") {
    return { ok: true, mode: "delta", value: 0 };
  }
  const b = body as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(b, "set")) {
    const value = Math.floor(Number(b.set));
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: "invalid set" };
    }
    return { ok: true, mode: "set", value };
  }
  const value = Math.floor(Number(b.delta ?? 0));
  if (!Number.isFinite(value)) {
    return { ok: false, error: "invalid delta" };
  }
  return { ok: true, mode: "delta", value };
}

export const adminPlayersRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/player/find-by-name?name=Nick — повертає character id, name, accountId (для інших дій)
  app.get<{ Querystring: { name?: string } }>(
    "/find-by-name",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const name = String((req.query as any)?.name ?? "").trim();
      if (!name) {
        await logAdminFailed(req, "admin.find_player_by_name", { message: "name required" });
        return reply.code(400).send({ error: "name required" });
      }
      const character = await prisma.character.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true, name: true, accountId: true, level: true, adena: true, coinLuck: true, coinsSilver: true, bannedUntil: true, blockedUntil: true, sex: true, heroJson: true } as any,
      });
      if (!character) {
        await logAdminFailed(req, "admin.find_player_by_name", { message: "character not found", targetCharacterName: name });
        return reply.code(404).send({ error: "character not found" });
      }
      const row = character as { bannedUntil?: Date | null; blockedUntil?: Date | null; heroJson?: any; [k: string]: unknown };
      const heroJson = (row.heroJson as any) || {};
      const profession = heroJson.profession || heroJson.klass || null;
      await logAdminSuccess(req, "admin.find_player_by_name", {
        targetCharacterId: String(character.id),
        targetCharacterName: String(character.name),
        metadata: { queryName: name },
      });
      return {
        ok: true,
        character: {
          id: character.id,
          name: character.name,
          accountId: character.accountId,
          level: character.level,
          adena: character.adena,
          coinLuck: character.coinLuck,
          coinsSilver: character.coinsSilver,
          bannedUntil: row.bannedUntil?.toISOString() ?? null,
          blockedUntil: row.blockedUntil?.toISOString() ?? null,
          sex: character.sex,
          profession,
        },
      };
    }
  );

  // GET /admin/player/:characterId/letters — листи гравця (вхідні + вихідні)
  app.get<{ Params: { characterId: string }; Querystring: { page?: string; limit?: string } }>(
    "/:characterId/letters",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const page = Math.max(1, Number.parseInt(String((req.query as any)?.page ?? "1"), 10) || 1);
      const limit = Math.min(50, Math.max(1, Number.parseInt(String((req.query as any)?.limit ?? "20"), 10) || 20));
      const skip = (page - 1) * limit;
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      const char = await prisma.character.findUnique({ where: { id: characterId }, select: { id: true } });
      if (!char) return reply.code(404).send({ error: "character not found" });
      const [letters, total] = await Promise.all([
        prisma.letter.findMany({
          where: { OR: [{ fromCharacterId: characterId }, { toCharacterId: characterId }] },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            fromCharacter: { select: { id: true, name: true } },
            toCharacter: { select: { id: true, name: true } },
          },
        }),
        prisma.letter.count({
          where: { OR: [{ fromCharacterId: characterId }, { toCharacterId: characterId }] },
        }),
      ]);
      return { ok: true, letters, total, page, limit };
    }
  );

  // GET /admin/player/:characterId/inventory — повертає інвентар гравця
  app.get<{ Params: { characterId: string } }>(
    "/:characterId/inventory",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      if (!characterId) return reply.code(400).send({ error: "characterId required" });

      const character = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });

      if (!character) return reply.code(404).send({ error: "character not found" });

      const heroJson = (character.heroJson as any) || {};
      const inventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];

      return {
        ok: true,
        inventory,
      };
    }
  );

  const ADMIN_NO_GIVE_IDS = new Set([
    "adena",
    "coin_of_luck",
    "coins_silver",
    "ancient_adena",
    "overflow_chest",
    "current_character_id",
  ]);

  // POST /admin/player/:characterId/give-item — { itemId, qty }
  app.post<{ Params: { characterId: string }; Body: { itemId?: string; qty?: number } }>(
    "/:characterId/give-item",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      const itemId = String(body?.itemId ?? "").trim();
      const qty = Math.max(1, Math.min(999, Number(body?.qty ?? 1)));
      const slot = String(body?.slot ?? "").trim() || "other";
      if (!characterId || !itemId) {
        await logAdminFailed(req, "admin.give_item", {
          message: "characterId and itemId required",
          targetCharacterId: characterId || null,
          metadata: { itemId, qty, slot },
        });
        return reply.code(400).send({ error: "characterId and itemId required" });
      }
      const itemKey = itemId.trim();
      if (ADMIN_NO_GIVE_IDS.has(itemKey.toLowerCase())) {
        await logAdminFailed(req, "admin.give_item", {
          message: "item not allowed for admin give",
          targetCharacterId: characterId,
          metadata: { itemId: itemKey, qty, slot },
        });
        return reply.code(400).send({ error: "This item cannot be given via admin" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.give_item", {
          message: "character not found",
          targetCharacterId: characterId,
          metadata: { itemId: itemKey, qty, slot },
        });
        return reply.code(404).send({ error: "character not found" });
      }

      const rowIdNorm = (x: any) => String(x?.id ?? x?.itemId ?? "").trim().toLowerCase();
      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const inventoryBefore = inventory.map((x) => ({ id: x?.id ?? x?.itemId, count: Number(x?.count ?? 1) }));
      const needle = itemKey.toLowerCase();
      const existing = inventory.find((x: any) => rowIdNorm(x) === needle);
      if (existing) {
        existing.count = (existing.count ?? 1) + qty;
      } else {
        inventory.push({ id: itemKey, name: itemKey, slot, count: qty });
      }
      const oldRev = Number(heroJson.heroRevision ?? 0) || 0;
      const newHeroJson = addVersioning({ ...heroJson, inventory }, oldRev);
      await prisma.character.update({
        where: { id: characterId },
        data: { heroJson: newHeroJson },
      });
      await logAdminSuccess(req, "admin.give_item", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { inventory: inventoryBefore },
        after: { inventory: inventory.map((x) => ({ id: x?.id ?? x?.itemId, count: Number(x?.count ?? 1) })) },
        metadata: { itemId, qty, slot },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/take-item — { itemId, qty }
  app.post<{ Params: { characterId: string }; Body: { itemId?: string; qty?: number } }>(
    "/:characterId/take-item",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      const itemId = String(body?.itemId ?? "").trim();
      const itemKey = itemId;
      const qty = Math.max(1, Number(body?.qty ?? 1));
      if (!characterId || !itemKey) {
        await logAdminFailed(req, "admin.take_item", {
          message: "characterId and itemId required",
          targetCharacterId: characterId || null,
          metadata: { itemId: itemKey, qty },
        });
        return reply.code(400).send({ error: "characterId and itemId required" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.take_item", {
          message: "character not found",
          targetCharacterId: characterId,
          metadata: { itemId: itemKey, qty },
        });
        return reply.code(404).send({ error: "character not found" });
      }

      const rowIdNorm = (x: any) => String(x?.id ?? x?.itemId ?? "").trim().toLowerCase();
      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const inventoryBefore = inventory.map((x) => ({ id: x?.id ?? x?.itemId, count: Number(x?.count ?? 1) }));
      const needle = itemKey.toLowerCase();
      const idx = inventory.findIndex((x: any) => rowIdNorm(x) === needle);
      if (idx === -1) {
        await logAdminFailed(req, "admin.take_item", {
          message: "item not found in inventory",
          targetCharacterId: characterId,
          targetCharacterName: char.name,
          metadata: { itemId: itemKey, qty },
        });
        return reply.code(400).send({ error: "item not found in inventory" });
      }
      const entry = inventory[idx];
      const current = Math.max(0, Number(entry.count ?? 1));
      const remove = Math.min(qty, current);
      if (remove >= current) {
        inventory.splice(idx, 1);
      } else {
        entry.count = current - remove;
      }
      const oldRev = Number(heroJson.heroRevision ?? 0) || 0;
      const newHeroJson = addVersioning({ ...heroJson, inventory }, oldRev);
      await prisma.character.update({
        where: { id: characterId },
        data: { heroJson: newHeroJson },
      });
      await logAdminSuccess(req, "admin.take_item", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { inventory: inventoryBefore },
        after: { inventory: inventory.map((x) => ({ id: x?.id ?? x?.itemId, count: Number(x?.count ?? 1) })) },
        metadata: { itemId, qty },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/set-inventory-enchant — лише admin cookie; не можна підробити звичайним PUT героя
  app.post<{
    Params: { characterId: string };
    Body: {
      index?: number;
      enchantLevel?: number;
      expectedItemId?: string;
      expectedEnchant?: number;
      expectedCount?: number;
    };
  }>(
    "/:characterId/set-inventory-enchant",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      const index = Math.max(0, Math.floor(Number(body?.index)));
      const wantLevel = Math.floor(Number(body?.enchantLevel ?? NaN));
      const expectedItemId = String(body?.expectedItemId ?? "").trim();
      const expectedEnchant = Math.max(0, Math.floor(Number(body?.expectedEnchant ?? 0)));
      const expectedCount = Math.max(1, Math.floor(Number(body?.expectedCount ?? 1)));

      if (!characterId || !expectedItemId || !Number.isFinite(wantLevel)) {
        await logAdminFailed(req, "admin.set_inventory_enchant", {
          message: "invalid body",
          targetCharacterId: characterId || null,
          metadata: { index, wantLevel, expectedItemId },
        });
        return reply.code(400).send({ error: "invalid input" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_inventory_enchant", {
          message: "character not found",
          targetCharacterId: characterId,
        });
        return reply.code(404).send({ error: "character not found" });
      }

      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      if (index >= inventory.length) {
        await logAdminFailed(req, "admin.set_inventory_enchant", {
          message: "index out of range",
          targetCharacterId: characterId,
          targetCharacterName: char.name,
          metadata: { index, len: inventory.length },
        });
        return reply.code(400).send({ error: "invalid input" });
      }

      const row = inventory[index];
      const rowId = String(row?.id ?? row?.itemId ?? "").trim();
      const rowEnc = Math.max(0, Math.floor(Number(row?.enchantLevel ?? 0)));
      const rowCnt = Math.max(1, Math.floor(Number(row?.count ?? 1)));

      if (
        rowId !== expectedItemId ||
        rowEnc !== expectedEnchant ||
        rowCnt !== expectedCount
      ) {
        await logAdminFailed(req, "admin.set_inventory_enchant", {
          message: "inventory row mismatch",
          targetCharacterId: characterId,
          targetCharacterName: char.name,
          metadata: { index, rowId, rowEnc, rowCnt, expectedItemId, expectedEnchant, expectedCount },
        });
        return reply.code(409).send({ error: "inventory changed" });
      }

      const maxEnc = maxEnchantForInventoryRow(row);
      if (maxEnc <= 0) {
        await logAdminFailed(req, "admin.set_inventory_enchant", {
          message: "item not enchantable",
          targetCharacterId: characterId,
          targetCharacterName: char.name,
          metadata: { rowId },
        });
        return reply.code(400).send({ error: "item cannot be enchanted" });
      }

      const level = Math.max(0, Math.min(maxEnc, wantLevel));
      const before = { id: rowId, enchant: rowEnc, count: rowCnt };
      inventory[index] = { ...row, enchantLevel: level, count: rowCnt };

      // Якщо той самий id зараз одягнений — UI бере заточку з equipmentEnchantLevels, не з рядка інвентаря
      const equipment: Record<string, unknown> = { ...(heroJson.equipment || {}) };
      const nextEnch: Record<string, number> = { ...(heroJson.equipmentEnchantLevels || {}) };
      const normRow = String(rowId).replace(/^shop_/i, "").toLowerCase();
      for (const slot of Object.keys(equipment)) {
        const rawEq = equipment[slot];
        if (rawEq == null || typeof rawEq !== "string") continue;
        const sid = String(rawEq).replace(/^shop_/i, "").toLowerCase();
        if (sid === normRow) nextEnch[slot] = level;
      }

      const oldRev = Number(heroJson.heroRevision ?? 0) || 0;
      const updatedHeroJson = addVersioning(
        {
          ...heroJson,
          inventory,
          equipmentEnchantLevels: nextEnch,
        },
        oldRev
      );

      await prisma.character.update({
        where: { id: characterId },
        data: { heroJson: updatedHeroJson },
      });

      await logAdminSuccess(req, "admin.set_inventory_enchant", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before,
        after: { id: rowId, enchant: level, count: rowCnt },
        metadata: { index, maxEnc },
      });

      return { ok: true, enchantLevel: level, maxEnchant: maxEnc };
    }
  );

  // POST /admin/player/:characterId/set-level — { level } 0–80
  // ВАЖЛИВО: у клієнтській бойовій/рибальській логіці hero.exp — це прогрес В МЕЖАХ поточного рівня (не cumulative).
  // Тому після адмін-зміни рівня скидаємо exp до 0, щоб EXP знову коректно додавався.
  app.post<{ Params: { characterId: string }; Body: { level?: number } }>(
    "/:characterId/set-level",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const level = Math.max(0, Math.min(80, Number((req.body as any)?.level ?? 1)));
      if (!characterId) {
        await logAdminFailed(req, "admin.set_level", { message: "characterId required", metadata: { level } });
        return reply.code(400).send({ error: "characterId required" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true, level: true, exp: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_level", { message: "character not found", targetCharacterId: characterId, metadata: { level } });
        return reply.code(404).send({ error: "character not found" });
      }

      // Після ручної зміни рівня стартуємо з 0 прогресу поточного рівня.
      const expForLevel = 0;
      const heroJson = (char.heroJson as any) || {};
      const lvl = Math.max(1, level);
      const baseStats = heroJson.baseStats || heroJson.baseStatsInitial || {};
      const CON = Number(baseStats.CON ?? 40);
      const MEN = Number(baseStats.MEN ?? 25);
      const conBonus = 1 + (CON - 40) * 0.01;
      const menBonus = 1 + (MEN - 25) * 0.01;
      const baseHp = 200 + lvl * 56;
      const baseMp = 100 + lvl * 8;
      const maxHp = Math.max(1, Math.round(baseHp * conBonus));
      const maxMp = Math.max(1, Math.round(baseMp * menBonus));
      const maxCp = Math.max(1, Math.round(maxHp * 0.6));
      const rawSkills = Array.isArray(heroJson.skills) ? heroJson.skills : [];
      const clampedSkills = clampHeroSkillsToPlayerLevel(
        rawSkills.map((x: any) => ({ id: Number(x.id), level: Number(x.level) || 1 })),
        lvl
      );
      const oldRev = Number(heroJson.heroRevision ?? 0) || 0;
      const adminLevelSetAt = Date.now();
      const updatedHeroJson = addVersioning(
        {
          ...heroJson,
          level: lvl,
          exp: expForLevel,
          skills: clampedSkills,
          hp: maxHp,
          mp: maxMp,
          cp: maxCp,
          maxHp,
          maxMp,
          maxCp,
          // Клієнт дозволяє знизити рівень лише якщо це поле новіше за збережене локально
          adminLevelSetAt,
        },
        oldRev
      );
      await prisma.character.update({
        where: { id: characterId },
        data: { level: lvl, exp: BigInt(expForLevel), heroJson: updatedHeroJson },
      });
      await logAdminSuccess(req, "admin.set_level", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { level: char.level, exp: Number(char.exp ?? 0) },
        after: { level: lvl, exp: expForLevel },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/adena — { delta } (додати/забрати) або { set } (встановити)
  app.post<{ Params: { characterId: string }; Body: { delta?: number; set?: number } }>(
    "/:characterId/adena",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      if (!characterId) {
        await logAdminFailed(req, "admin.set_adena", { message: "characterId required", metadata: { body } });
        return reply.code(400).send({ error: "characterId required" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, adena: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_adena", { message: "character not found", targetCharacterId: characterId, metadata: { body } });
        return reply.code(404).send({ error: "character not found" });
      }

      const currentAdena = Number(char.adena ?? 0);
      let newAdena: number;
      if (typeof body?.set === "number" && body.set >= 0) {
        newAdena = Math.min(2_000_000_000, Math.floor(body.set));
      } else {
        const delta = Number(body?.delta ?? 0);
        newAdena = Math.max(0, Math.min(2_000_000_000, currentAdena + delta));
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { adena: newAdena },
      });
      await logAdminSuccess(req, "admin.set_adena", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { adena: currentAdena },
        after: { adena: newAdena },
        metadata: { body },
      });
      return { ok: true, adena: newAdena };
    }
  );

  // POST /admin/player/:characterId/coin-luck — { delta } або { set }
  app.post<{ Params: { characterId: string }; Body: { delta?: number; set?: number } }>(
    "/:characterId/coin-luck",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      if (!characterId) {
        await logAdminFailed(req, "admin.set_coin_luck", { message: "characterId required", metadata: { body } });
        return reply.code(400).send({ error: "characterId required" });
      }

      const parsed = parseAdminCurrencyDeltaOrSet(body);
      if (!parsed.ok) {
        await logAdminFailed(req, "admin.set_coin_luck", { message: parsed.error, targetCharacterId: characterId, metadata: { body } });
        return reply.code(400).send({ error: parsed.error });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, coinLuck: true, heroJson: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_coin_luck", { message: "character not found", targetCharacterId: characterId, metadata: { body } });
        return reply.code(404).send({ error: "character not found" });
      }

      const currentCoinLuck = Number(char.coinLuck ?? 0);
      let newCoinLuck: number;
      if (parsed.mode === "set") {
        newCoinLuck = Math.min(2_000_000_000, parsed.value);
      } else {
        newCoinLuck = Math.max(0, Math.min(2_000_000_000, currentCoinLuck + parsed.value));
      }
      const heroJson = (char.heroJson as any) || {};
      const oldRev = Number(heroJson.heroRevision ?? 0) || 0;
      const updatedHeroJson = addVersioning({ ...heroJson, coinOfLuck: newCoinLuck }, oldRev);
      await prisma.character.update({
        where: { id: characterId },
        data: { coinLuck: newCoinLuck, heroJson: updatedHeroJson },
      });
      await logAdminSuccess(req, "admin.set_coin_luck", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { coinLuck: currentCoinLuck },
        after: { coinLuck: newCoinLuck },
        metadata: { body },
      });
      return { ok: true, coinLuck: newCoinLuck };
    }
  );

  // POST /admin/player/:characterId/coins-silver — { delta } або { set }
  app.post<{ Params: { characterId: string }; Body: { delta?: number; set?: number } }>(
    "/:characterId/coins-silver",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      if (!characterId) {
        await logAdminFailed(req, "admin.set_coins_silver", { message: "characterId required", metadata: { body } });
        return reply.code(400).send({ error: "characterId required" });
      }

      const parsed = parseAdminCurrencyDeltaOrSet(body);
      if (!parsed.ok) {
        await logAdminFailed(req, "admin.set_coins_silver", { message: parsed.error, targetCharacterId: characterId, metadata: { body } });
        return reply.code(400).send({ error: parsed.error });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, coinsSilver: true, heroJson: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_coins_silver", { message: "character not found", targetCharacterId: characterId, metadata: { body } });
        return reply.code(404).send({ error: "character not found" });
      }

      const current = Number(char.coinsSilver ?? 0);
      let newCoinsSilver: number;
      if (parsed.mode === "set") {
        newCoinsSilver = Math.min(2_000_000_000, parsed.value);
      } else {
        newCoinsSilver = Math.max(0, Math.min(2_000_000_000, current + parsed.value));
      }
      const heroJson = (char.heroJson as any) || {};
      const oldRev = Number(heroJson.heroRevision ?? 0) || 0;
      const updatedHeroJson = addVersioning({ ...heroJson, coins_silver: newCoinsSilver }, oldRev);
      await prisma.character.update({
        where: { id: characterId },
        data: { coinsSilver: newCoinsSilver, heroJson: updatedHeroJson },
      });
      await logAdminSuccess(req, "admin.set_coins_silver", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { coinsSilver: current },
        after: { coinsSilver: newCoinsSilver },
        metadata: { body },
      });
      return { ok: true, coinsSilver: newCoinsSilver };
    }
  );

  // POST /admin/player/force-logout — { characterId } або { name } — ревокація всіх refresh токенів акаунта
  app.post<{ Body: { characterId?: string; name?: string } }>(
    "/force-logout",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const body = req.body as any;
      const characterId = String(body?.characterId ?? "").trim();
      const name = String(body?.name ?? "").trim();

      let accountId: string;
      let targetCharacterId: string | null = null;
      let targetCharacterName: string | null = null;
      if (characterId) {
        const char = await prisma.character.findUnique({
          where: { id: characterId },
          select: { id: true, name: true, accountId: true },
        });
        if (!char) {
          await logAdminFailed(req, "admin.force_logout", { message: "character not found", targetCharacterId: characterId });
          return reply.code(404).send({ error: "character not found" });
        }
        targetCharacterId = char.id;
        targetCharacterName = char.name;
        accountId = char.accountId;
      } else if (name) {
        const c = await prisma.character.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
          select: { id: true, name: true, accountId: true },
        });
        if (!c) {
          await logAdminFailed(req, "admin.force_logout", { message: "character not found", targetCharacterName: name });
          return reply.code(404).send({ error: "character not found" });
        }
        targetCharacterId = c.id;
        targetCharacterName = c.name;
        accountId = c.accountId;
      } else {
        await logAdminFailed(req, "admin.force_logout", { message: "characterId or name required" });
        return reply.code(400).send({ error: "characterId or name required" });
      }

      await prisma.refreshToken.updateMany({
        where: { accountId },
        data: { revokedAt: new Date() },
      });
      await logAdminSuccess(req, "admin.force_logout", {
        targetCharacterId,
        targetCharacterName,
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/ban — { durationMinutes }
  app.post<{ Params: { characterId: string }; Body: { durationMinutes?: number } }>(
    "/:characterId/ban",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const durationMinutes = Math.max(1, Math.min(60 * 24 * 365, Number((req.body as any)?.durationMinutes ?? 60)));
      if (!characterId) {
        await logAdminFailed(req, "admin.ban", { message: "characterId required", metadata: { durationMinutes } });
        return reply.code(400).send({ error: "characterId required" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, bannedUntil: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.ban", { message: "character not found", targetCharacterId: characterId });
        return reply.code(404).send({ error: "character not found" });
      }

      const until = new Date(Date.now() + durationMinutes * 60 * 1000);
      await prisma.character.update({
        where: { id: characterId },
        data: { bannedUntil: until } as any,
      });
      await logAdminSuccess(req, "admin.ban", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { bannedUntil: char.bannedUntil?.toISOString() ?? null },
        after: { bannedUntil: until.toISOString() },
      });
      return { ok: true, bannedUntil: until.toISOString() };
    }
  );

  // POST /admin/player/:characterId/unban
  app.post<{ Params: { characterId: string } }>(
    "/:characterId/unban",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      if (!characterId) {
        await logAdminFailed(req, "admin.unban", { message: "characterId required" });
        return reply.code(400).send({ error: "characterId required" });
      }
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, bannedUntil: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.unban", { message: "character not found", targetCharacterId: characterId });
        return reply.code(404).send({ error: "character not found" });
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { bannedUntil: null } as any,
      });
      await logAdminSuccess(req, "admin.unban", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { bannedUntil: char.bannedUntil?.toISOString() ?? null },
        after: { bannedUntil: null },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/block — { durationMinutes }
  app.post<{ Params: { characterId: string }; Body: { durationMinutes?: number } }>(
    "/:characterId/block",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const durationMinutes = Math.max(1, Math.min(60 * 24 * 365, Number((req.body as any)?.durationMinutes ?? 60)));
      if (!characterId) {
        await logAdminFailed(req, "admin.block", { message: "characterId required", metadata: { durationMinutes } });
        return reply.code(400).send({ error: "characterId required" });
      }
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, blockedUntil: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.block", { message: "character not found", targetCharacterId: characterId });
        return reply.code(404).send({ error: "character not found" });
      }

      const until = new Date(Date.now() + durationMinutes * 60 * 1000);
      await prisma.character.update({
        where: { id: characterId },
        data: { blockedUntil: until } as any,
      });
      await logAdminSuccess(req, "admin.block", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { blockedUntil: char.blockedUntil?.toISOString() ?? null },
        after: { blockedUntil: until.toISOString() },
      });
      return { ok: true, blockedUntil: until.toISOString() };
    }
  );

  // POST /admin/player/:characterId/unblock
  app.post<{ Params: { characterId: string } }>(
    "/:characterId/unblock",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      if (!characterId) {
        await logAdminFailed(req, "admin.unblock", { message: "characterId required" });
        return reply.code(400).send({ error: "characterId required" });
      }
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, blockedUntil: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.unblock", { message: "character not found", targetCharacterId: characterId });
        return reply.code(404).send({ error: "character not found" });
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { blockedUntil: null } as any,
      });
      await logAdminSuccess(req, "admin.unblock", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { blockedUntil: char.blockedUntil?.toISOString() ?? null },
        after: { blockedUntil: null },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/heal — повне лікування (hp/mp/cp = max)
  app.post<{ Params: { characterId: string } }>(
    "/:characterId/heal",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });
      const heroJson = (char.heroJson as any) || {};
      const maxHp = Math.max(100, Number(heroJson.maxHp) || 100);
      const maxMp = Math.max(50, Number(heroJson.maxMp) || 50);
      const maxCp = Math.max(1, Number(heroJson.maxCp) || Math.round(maxHp * 0.6));
      const patched = addVersioning({
        ...heroJson,
        hp: maxHp, mp: maxMp, cp: maxCp,
        hpFull: true, mpFull: true, cpFull: true,
        hpPercent: 1, mpPercent: 1, cpPercent: 1,
      }, Number(heroJson.heroRevision ?? 0) || 0);
      await prisma.character.update({
        where: { id: characterId },
        data: { heroJson: patched, lastActivityAt: new Date() },
      });
      await logAdminSuccess(req, "admin.heal", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        metadata: { maxHp, maxMp, maxCp },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/resurrect — воскресити (скинути смерть, hp/mp/cp на max)
  app.post<{ Params: { characterId: string } }>(
    "/:characterId/resurrect",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      const ch = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });
      const heroJson = (ch.heroJson ?? {}) as any;
      const maxHp = Math.max(1, Number(heroJson.maxHp) || 100);
      const maxMp = Math.max(1, Number(heroJson.maxMp) || 50);
      const maxCp = Math.max(1, Number(heroJson.maxCp) || Math.round(maxHp * 0.6));
      const patched = addVersioning({
        ...heroJson,
        isDead: false, deadAt: 0,
        hp: maxHp, mp: maxMp, cp: maxCp,
        hpFull: true, mpFull: true, cpFull: true,
        hpPercent: 1, mpPercent: 1, cpPercent: 1,
        heroBuffs: [],
      }, Number(heroJson.heroRevision ?? 0) || 0);
      await prisma.character.update({
        where: { id: characterId },
        data: { heroJson: patched, lastActivityAt: new Date() },
      });
      await logAdminSuccess(req, "admin.resurrect", {
        targetCharacterId: characterId,
        targetCharacterName: ch.name,
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/premium — { days } або { until: timestamp }
  app.post<{ Params: { characterId: string }; Body: { days?: number; until?: number } }>(
    "/:characterId/premium",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });
      const heroJson = (char.heroJson as any) || {};
      const now = Date.now();
      const prevUntil = Number(heroJson.premiumUntil ?? 0) || 0;
      let until: number;
      if (typeof body?.until === "number" && body.until > now) {
        until = body.until;
      } else if (typeof body?.days === "number" && body.days > 0) {
        const base = Math.max(now, prevUntil);
        until = base + body.days * 24 * 60 * 60 * 1000;
      } else {
        await logAdminFailed(req, "admin.set_premium", { message: "days or until required" });
        return reply.code(400).send({ error: "days (number) or until (timestamp) required" });
      }
      const patched = addVersioning({
        ...heroJson,
        premiumUntil: until,
      }, Number(heroJson.heroRevision ?? 0) || 0);
      await prisma.character.update({
        where: { id: characterId },
        data: { heroJson: patched },
      });
      await logAdminSuccess(req, "admin.set_premium", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { premiumUntil: prevUntil },
        after: { premiumUntil: until },
        metadata: { days: body?.days, until },
      });
      return { ok: true, premiumUntil: until };
    }
  );

  // POST /admin/player/:characterId/change-class — { newProfession: string, skills?: { id: number; level: number }[], sex?: string }
  app.post<{ Params: { characterId: string }; Body: { newProfession?: string; skills?: Array<{ id: number; level?: number }>; sex?: string } }>(
    "/:characterId/change-class",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const body = req.body as any;
      const newProfession = String(body?.newProfession ?? "").trim();
      const skills = Array.isArray(body?.skills) ? body.skills : [];
      const newSexRaw = String(body?.sex ?? "").trim().toLowerCase();
      const newSex = newSexRaw === "male" || newSexRaw === "female" ? newSexRaw : null;

      if (!characterId) {
        await logAdminFailed(req, "admin.change_class", { message: "characterId required" });
        return reply.code(400).send({ error: "characterId required" });
      }
      if (!newProfession) {
        await logAdminFailed(req, "admin.change_class", { message: "newProfession required" });
        return reply.code(400).send({ error: "newProfession required" });
      }
      if (!newSex) {
        await logAdminFailed(req, "admin.change_class", { message: "sex required (male or female)" });
        return reply.code(400).send({ error: "sex required (male or female)" });
      }

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true, classId: true, race: true, sex: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.change_class", { message: "character not found", targetCharacterId: characterId });
        return reply.code(404).send({ error: "character not found" });
      }

      const heroJson = (char.heroJson as any) || {};
      const newClassId = newProfession.toLowerCase().includes("mystic") ? "Маг" : "Воїн";
      const newSkills = skills
        .filter((s: any) => s && typeof s.id === "number")
        .map((s: any) => ({
          id: Number(s.id),
          level: Math.max(1, Math.min(100, Number(s.level ?? 1) || 1)),
        }));

      const patched = addVersioning(
        {
          ...heroJson,
          profession: newProfession,
          classId: newClassId,
          klass: newClassId,
          skills: newSkills,
          gender: newSex,
          loadout: [],
          // Клієнт синкає панель бою та бафи з heroJson — без очищення лишаються скилли/бафи старого класу
          heroBuffs: [],
          battleLoadoutSlots: [0, null],
        },
        Number(heroJson.heroRevision ?? 0) || 0
      );

      const updateData: { heroJson: any; classId: string; sex?: string } = { heroJson: patched, classId: newClassId };
      updateData.sex = newSex;

      await prisma.character.update({
        where: { id: characterId },
        data: updateData,
      });

      await logAdminSuccess(req, "admin.change_class", {
        targetCharacterId: characterId,
        targetCharacterName: char.name,
        before: { profession: heroJson.profession, classId: char.classId, sex: char.sex },
        after: { profession: newProfession, classId: newClassId, sex: newSex, skillsCount: newSkills.length },
      });
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/mute — { durationMinutes } (дубль до /admin/chat/mute, але по characterId в URL)
  app.post<{ Params: { characterId: string }; Body: { durationMinutes?: number } }>(
    "/:characterId/mute",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const durationMinutes = Math.min(60 * 24, Math.max(1, Number((req.body as any)?.durationMinutes ?? 10)));
      if (!characterId) {
        await logAdminFailed(req, "admin.mute", { message: "characterId required", metadata: { durationMinutes } });
        return reply.code(400).send({ error: "characterId required" });
      }
      const char = await prisma.character.findUnique({ where: { id: characterId }, select: { id: true } });
      if (!char) {
        await logAdminFailed(req, "admin.mute", { message: "character not found", targetCharacterId: characterId });
        return reply.code(404).send({ error: "character not found" });
      }
      await setMuted(characterId, durationMinutes);
      await logAdminSuccess(req, "admin.mute", {
        targetCharacterId: characterId,
        metadata: { durationMinutes },
      });
      return { ok: true };
    }
  );
};
