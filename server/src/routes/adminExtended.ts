import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";
import { prisma } from "../db";
import { writeAdminAuditLog } from "../adminAudit";

function getAdminLogin(req: any): string {
  return String(req?.admin?.login || "unknown");
}

async function logAdminSuccess(req: any, action: string, payload: Record<string, unknown> = {}) {
  await writeAdminAuditLog({ req, adminLogin: getAdminLogin(req), action, status: "success", ...payload });
}
async function logAdminFailed(req: any, action: string, payload: Record<string, unknown> = {}) {
  await writeAdminAuditLog({ req, adminLogin: getAdminLogin(req), action, status: "failed", ...payload });
}

/** Отримати або створити системного персонажа для листів від адміна */
async function getSystemCharacterId(): Promise<string> {
  const existing = await prisma.kv.findUnique({ where: { key: "system_character_id" } });
  if (existing?.value) return existing.value;

  const bcrypt = await import("bcrypt");
  const passHash = await bcrypt.hash("__system__" + Date.now(), 10);
  const account = await prisma.account.create({
    data: { login: "__system__", passHash },
    select: { id: true },
  });
  const character = await prisma.character.create({
    data: {
      accountId: account.id,
      name: "[Система]",
      race: "human",
      classId: "fighter",
      sex: "male",
    },
    select: { id: true },
  });
  await prisma.kv.upsert({
    where: { key: "system_character_id" },
    create: { key: "system_character_id", value: character.id, updatedAt: new Date() },
    update: { value: character.id, updatedAt: new Date() },
  });
  return character.id;
}

export const adminExtendedRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/players?name=&page=1&limit=20 — пошук персонажів (частковий збіг по імені)
  app.get<{ Querystring: { name?: string; page?: string; limit?: string } }>(
    "/players",
    { preHandler: [requireAdmin] },
    async (req) => {
      const name = String((req.query as any)?.name ?? "").trim();
      const page = Math.max(1, Number.parseInt(String((req.query as any)?.page ?? "1"), 10) || 1);
      const limit = Math.min(50, Math.max(1, Number.parseInt(String((req.query as any)?.limit ?? "20"), 10) || 20));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (name) {
        where.name = { contains: name, mode: "insensitive" };
      }

      const [characters, total] = await Promise.all([
        prisma.character.findMany({
          where,
          orderBy: [{ level: "desc" }, { name: "asc" }],
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            level: true,
            createdAt: true,
            bannedUntil: true,
            blockedUntil: true,
            clanMember: {
              select: { clan: { select: { id: true, name: true } } },
            },
          },
        }),
        prisma.character.count({ where }),
      ]);

      return {
        ok: true,
        characters: characters.map((c: any) => ({
          id: c.id,
          name: c.name,
          level: c.level,
          createdAt: c.createdAt,
          bannedUntil: c.bannedUntil?.toISOString() ?? null,
          blockedUntil: c.blockedUntil?.toISOString() ?? null,
          clan: c.clanMember?.clan ?? null,
        })),
        total,
        page,
        limit,
      };
    }
  );

  // GET /admin/players/online — список онлайн гравців (активні за 10 хв)
  app.get("/players/online", { preHandler: [requireAdmin] }, async () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const online = await prisma.character.findMany({
      where: { lastActivityAt: { gte: tenMinAgo } },
      orderBy: [{ level: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        lastActivityAt: true,
        clanMember: { select: { clan: { select: { name: true } } } },
      },
    });
    return {
      ok: true,
      characters: online.map((c: any) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        lastActivityAt: c.lastActivityAt?.toISOString() ?? null,
        clan: c.clanMember?.clan?.name ?? null,
      })),
    };
  });

  // POST /admin/letters — відправити системний лист гравцю
  app.post<{ Body: { toCharacterId?: string; toCharacterName?: string; subject?: string; message?: string } }>(
    "/letters",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const body = req.body as any;
      const toId = String(body?.toCharacterId ?? "").trim();
      const toName = String(body?.toCharacterName ?? "").trim();
      const subject = String(body?.subject ?? "[Система]").trim() || "[Система]";
      const message = String(body?.message ?? "").trim();

      if (!message) {
        await logAdminFailed(req, "admin.send_letter", { message: "message required" });
        return reply.code(400).send({ error: "message is required" });
      }

      let toChar: { id: string; name: string } | null = null;
      if (toId) {
        toChar = await prisma.character.findUnique({
          where: { id: toId },
          select: { id: true, name: true },
        });
      } else if (toName) {
        toChar = await prisma.character.findFirst({
          where: { name: { equals: toName, mode: "insensitive" } },
          select: { id: true, name: true },
        });
      }
      if (!toChar) {
        await logAdminFailed(req, "admin.send_letter", { message: "recipient not found" });
        return reply.code(404).send({ error: "recipient character not found" });
      }

      const fromId = await getSystemCharacterId();
      const letter = await prisma.letter.create({
        data: {
          fromCharacterId: fromId,
          toCharacterId: toChar.id,
          subject: subject.startsWith("[") ? subject : `[Система] ${subject}`,
          message,
        },
      });
      await logAdminSuccess(req, "admin.send_letter", {
        targetCharacterId: toChar.id,
        targetCharacterName: toChar.name,
        metadata: { letterId: letter.id },
      });
      return { ok: true, letterId: letter.id };
    }
  );

  // GET /admin/clans — список кланів з членами
  app.get("/clans", { preHandler: [requireAdmin] }, async () => {
    const clans = await prisma.clan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { members: true } },
        members: {
          include: { character: { select: { id: true, name: true } } },
        },
      },
    });
    return {
      ok: true,
      clans: clans.map((c: any) => ({
        ...c,
        members: c.members?.map((m: any) => ({
          id: m.id,
          characterId: m.characterId,
          character: m.character,
        })) ?? [],
      })),
    };
  });

  // POST /admin/clans/:id/disband — розпустити клан
  app.post<{ Params: { id: string } }>(
    "/clans/:id/disband",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const clanId = String((req.params as any).id ?? "").trim();
      const clan = await prisma.clan.findUnique({
        where: { id: clanId },
        include: { creator: { select: { name: true } } },
      });
      if (!clan) return reply.code(404).send({ error: "clan not found" });

      await prisma.clan.delete({ where: { id: clanId } });
      await logAdminSuccess(req, "admin.disband_clan", {
        targetCharacterId: clan.creatorId,
        targetCharacterName: clan.creator?.name,
        metadata: { clanId, clanName: clan.name },
      });
      return { ok: true };
    }
  );

  // POST /admin/clans/:id/members/:characterId/kick — вигнати гравця з клану
  app.post<{ Params: { id: string; characterId: string } }>(
    "/clans/:id/members/:characterId/kick",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const clanId = String((req.params as any).id ?? "").trim();
      const characterId = String((req.params as any).characterId ?? "").trim();

      const member = await prisma.clanMember.findFirst({
        where: { clanId, characterId },
        include: {
          clan: { select: { name: true } },
          character: { select: { name: true } },
        },
      });
      if (!member) return reply.code(404).send({ error: "member not found in this clan" });

      await prisma.clanMember.delete({ where: { id: member.id } });
      await logAdminSuccess(req, "admin.kick_from_clan", {
        targetCharacterId: characterId,
        targetCharacterName: member.character?.name,
        metadata: { clanId, clanName: member.clan?.name },
      });
      return { ok: true };
    }
  );
};
