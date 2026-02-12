import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";
import { prisma } from "../db";
import { setMuted } from "../chatMute";

export const adminPlayersRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/player/find-by-name?name=Nick — повертає character id, name, accountId (для інших дій)
  app.get<{ Querystring: { name?: string } }>(
    "/find-by-name",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const name = String((req.query as any)?.name ?? "").trim();
      if (!name) return reply.code(400).send({ error: "name required" });
      const character = await prisma.character.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true, name: true, accountId: true, level: true, adena: true, coinLuck: true, bannedUntil: true, blockedUntil: true } as any,
      });
      if (!character)
        return reply.code(404).send({ error: "character not found" });
      const row = character as { bannedUntil?: Date | null; blockedUntil?: Date | null; [k: string]: unknown };
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
      if (!characterId || !itemId) return reply.code(400).send({ error: "characterId and itemId required" });

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, heroJson: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });

      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
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
      if (!characterId || !itemId) return reply.code(400).send({ error: "characterId and itemId required" });

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, heroJson: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });

      const heroJson = (char.heroJson as any) || {};
      const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const idx = inventory.findIndex((x: any) => (x.id || x.itemId) === itemId);
      if (idx === -1) return reply.code(400).send({ error: "item not found in inventory" });
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
      return { ok: true };
    }
  );

  // POST /admin/player/:characterId/set-level — { level } 0–80, exp підлаштовується під рівень
  app.post<{ Params: { characterId: string }; Body: { level?: number } }>(
    "/:characterId/set-level",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const characterId = String((req.params as any).characterId ?? "").trim();
      const level = Math.max(0, Math.min(80, Number((req.body as any)?.level ?? 1)));
      if (!characterId) return reply.code(400).send({ error: "characterId required" });

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, heroJson: true, level: true, exp: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });

      // exp для рівня: можна захардкодити 0 для level 1, або просту формулу
      const expForLevel = level <= 1 ? 0 : BigInt(Math.min(Number.MAX_SAFE_INTEGER, (level - 1) * 1000));
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
        level,
        exp: Number(expForLevel),
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
        data: { level, exp: expForLevel, heroJson: updatedHeroJson },
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, adena: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });

      let newAdena: number;
      if (typeof body?.set === "number" && body.set >= 0) {
        newAdena = Math.min(2_000_000_000, Math.floor(body.set));
      } else {
        const delta = Number(body?.delta ?? 0);
        newAdena = Math.max(0, Math.min(2_000_000_000, char.adena + delta));
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { adena: newAdena },
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });

      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, coinLuck: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });

      let newCoinLuck: number;
      if (typeof body?.set === "number" && body.set >= 0) {
        newCoinLuck = Math.min(2_000_000_000, Math.floor(body.set));
      } else {
        const delta = Number(body?.delta ?? 0);
        newCoinLuck = Math.max(0, Math.min(2_000_000_000, char.coinLuck + delta));
      }
      await prisma.character.update({
        where: { id: characterId },
        data: { coinLuck: newCoinLuck },
      });
      return { ok: true, coinLuck: newCoinLuck };
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
      if (characterId) {
        const char = await prisma.character.findUnique({
          where: { id: characterId },
          select: { accountId: true },
        });
        if (!char) return reply.code(404).send({ error: "character not found" });
        accountId = char.accountId;
      } else if (name) {
        const c = await prisma.character.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
          select: { accountId: true },
        });
        if (!c) return reply.code(404).send({ error: "character not found" });
        accountId = c.accountId;
      } else {
        return reply.code(400).send({ error: "characterId or name required" });
      }

      await prisma.refreshToken.updateMany({
        where: { accountId },
        data: { revokedAt: new Date() },
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });

      const until = new Date(Date.now() + durationMinutes * 60 * 1000);
      await prisma.character.update({
        where: { id: characterId },
        data: { bannedUntil: until } as any,
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      await prisma.character.update({
        where: { id: characterId },
        data: { bannedUntil: null } as any,
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });

      const until = new Date(Date.now() + durationMinutes * 60 * 1000);
      await prisma.character.update({
        where: { id: characterId },
        data: { blockedUntil: until } as any,
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      await prisma.character.update({
        where: { id: characterId },
        data: { blockedUntil: null } as any,
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
      if (!characterId) return reply.code(400).send({ error: "characterId required" });
      const char = await prisma.character.findUnique({ where: { id: characterId }, select: { id: true } });
      if (!char) return reply.code(404).send({ error: "character not found" });
      setMuted(characterId, durationMinutes);
      return { ok: true };
    }
  );
};
