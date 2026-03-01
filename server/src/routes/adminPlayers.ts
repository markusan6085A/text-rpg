import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";
import { prisma } from "../db";
import { setMuted } from "../chatMute";
import { writeAdminAuditLog } from "../adminAudit";

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
        select: { id: true, name: true, accountId: true, level: true, adena: true, coinLuck: true, coinsSilver: true, bannedUntil: true, blockedUntil: true } as any,
      });
      if (!character) {
        await logAdminFailed(req, "admin.find_player_by_name", { message: "character not found", targetCharacterName: name });
        return reply.code(404).send({ error: "character not found" });
      }
      const row = character as { bannedUntil?: Date | null; blockedUntil?: Date | null; [k: string]: unknown };
      await logAdminSuccess(req, "admin.find_player_by_name", {
        targetCharacterId: String(character.id),
        targetCharacterName: String(character.name),
        metadata: { queryName: name },
      });
      return {
        ok: true,
        character: {
          ...character,
          bannedUntil: row.bannedUntil?.toISOString() ?? null,
          blockedUntil: row.blockedUntil?.toISOString() ?? null,
        },
      };
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

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, heroJson: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.give_item", {
          message: "character not found",
          targetCharacterId: characterId,
          metadata: { itemId, qty, slot },
        });
        return reply.code(404).send({ error: "character not found" });
      }

      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const inventoryBefore = inventory.map((x) => ({ id: x?.id ?? x?.itemId, count: Number(x?.count ?? 1) }));
      const existing = inventory.find((x: any) => (x.id || x.itemId) === itemId);
      if (existing) {
        existing.count = (existing.count ?? 1) + qty;
      } else {
        inventory.push({ id: itemId, name: itemId, slot, count: qty });
      }
      const newHeroJson = {
        ...heroJson,
        inventory,
        heroRevision: Date.now(),
        heroJsonVersion: heroJson.heroJsonVersion || 1,
      };
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
      const qty = Math.max(1, Number(body?.qty ?? 1));
      if (!characterId || !itemId) {
        await logAdminFailed(req, "admin.take_item", {
          message: "characterId and itemId required",
          targetCharacterId: characterId || null,
          metadata: { itemId, qty },
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
          metadata: { itemId, qty },
        });
        return reply.code(404).send({ error: "character not found" });
      }

      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const inventoryBefore = inventory.map((x) => ({ id: x?.id ?? x?.itemId, count: Number(x?.count ?? 1) }));
      const idx = inventory.findIndex((x: any) => (x.id || x.itemId) === itemId);
      if (idx === -1) {
        await logAdminFailed(req, "admin.take_item", {
          message: "item not found in inventory",
          targetCharacterId: characterId,
          targetCharacterName: char.name,
          metadata: { itemId, qty },
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
      const newHeroJson = {
        ...heroJson,
        inventory,
        heroRevision: Date.now(),
        heroJsonVersion: heroJson.heroJsonVersion || 1,
      };
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
      const updatedHeroJson = {
        ...heroJson,
        level: lvl,
        exp: expForLevel,
        heroRevision: Date.now(),
        heroJsonVersion: heroJson.heroJsonVersion || 1,
        hp: maxHp,
        mp: maxMp,
        cp: maxCp,
        maxHp,
        maxMp,
        maxCp,
      };
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

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, coinLuck: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_coin_luck", { message: "character not found", targetCharacterId: characterId, metadata: { body } });
        return reply.code(404).send({ error: "character not found" });
      }

      const currentCoinLuck = Number(char.coinLuck ?? 0);
      let newCoinLuck: number;
      if (typeof body?.set === "number" && body.set >= 0) {
        newCoinLuck = Math.min(2_000_000_000, Math.floor(body.set));
      } else {
        const delta = Number(body?.delta ?? 0);
        newCoinLuck = Math.max(0, Math.min(2_000_000_000, currentCoinLuck + delta));
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { coinLuck: newCoinLuck },
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

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, coinsSilver: true },
      });
      if (!char) {
        await logAdminFailed(req, "admin.set_coins_silver", { message: "character not found", targetCharacterId: characterId, metadata: { body } });
        return reply.code(404).send({ error: "character not found" });
      }

      const current = Number(char.coinsSilver ?? 0);
      let newCoinsSilver: number;
      if (typeof body?.set === "number" && body.set >= 0) {
        newCoinsSilver = Math.min(2_000_000_000, Math.floor(body.set));
      } else {
        const delta = Number(body?.delta ?? 0);
        newCoinsSilver = Math.max(0, Math.min(2_000_000_000, current + delta));
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { coinsSilver: newCoinsSilver },
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
