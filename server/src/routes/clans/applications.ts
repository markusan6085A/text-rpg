import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { getAuth } from "../character/auth";
import { canManageClan } from "./helpers";

/** Реєстрація роутів applications: apply, list, accept/decline */
export function registerClanApplicationRoutes(app: FastifyInstance) {
  // GET /clans/applications/mine — мої pending заявки
  app.get("/clans/applications/mine", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const applications = await prisma.clanApplication.findMany({
      where: {
        characterId: character.id,
        status: "pending",
      },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            level: true,
            emblem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      ok: true,
      applications: applications.map((a) => ({
        id: a.id,
        clanId: a.clanId,
        clanName: a.clan.name,
        clanLevel: a.clan.level,
        clanEmblem: a.clan.emblem,
        createdAt: a.createdAt,
      })),
    };
  });
}

/** Реєстрація вкладених application-роутів для /clans/:id/... */
export function registerClanApplicationNestedRoutes(app: FastifyInstance) {
  // POST /clans/:id/apply — подати заявку в клан
  app.post("/clans/:id/apply", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId } = req.params as { id: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const alreadyInClan = await prisma.clanMember.findFirst({
      where: { characterId: character.id },
    });
    if (alreadyInClan) {
      return reply.code(400).send({ error: "you already belong to a clan" });
    }

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) return reply.code(404).send({ error: "clan not found" });

    const memberCount = await prisma.clanMember.count({
      where: { clanId },
    });
    const maxMembers = clan.level >= 8 ? 80 : clan.level >= 7 ? 70 : clan.level >= 6 ? 60 : clan.level >= 5 ? 50 : clan.level >= 4 ? 40 : clan.level >= 3 ? 30 : clan.level >= 2 ? 20 : 10;
    if (memberCount >= maxMembers) {
      return reply.code(400).send({ error: "clan is full" });
    }

    try {
      const application = await prisma.clanApplication.upsert({
        where: {
          clanId_characterId: { clanId, characterId: character.id },
        },
        create: {
          clanId,
          characterId: character.id,
          status: "pending",
        },
        update: { status: "pending" },
      });

      return { ok: true, application: { id: application.id } };
    } catch (e: any) {
      if (e.code === "P2002") {
        return reply.code(409).send({ error: "application already submitted" });
      }
      throw e;
    }
  });

  // GET /clans/:id/applications — список заявок (лідер/зам)
  app.get("/clans/:id/applications", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId } = req.params as { id: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const canManage = await canManageClan(clanId, character.id);
    if (!canManage) {
      return reply.code(403).send({ error: "only leader or deputy can view applications" });
    }

    const applications = await prisma.clanApplication.findMany({
      where: { clanId, status: "pending" },
      include: {
        clan: false,
      },
    });

    const characterIds = [...new Set(applications.map((a) => a.characterId))];
    const characters = await prisma.character.findMany({
      where: { id: { in: characterIds } },
      select: { id: true, name: true, level: true },
    });
    const charMap = Object.fromEntries(characters.map((c) => [c.id, c]));

    return {
      ok: true,
      applications: applications.map((a) => ({
        id: a.id,
        characterId: a.characterId,
        characterName: charMap[a.characterId]?.name ?? "?",
        characterLevel: charMap[a.characterId]?.level ?? 0,
        createdAt: a.createdAt,
      })),
    };
  });

  // POST /clans/:id/applications/:characterId/accept
  app.post("/clans/:id/applications/:characterId/accept", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const canManage = await canManageClan(clanId, character.id);
    if (!canManage) {
      return reply.code(403).send({ error: "only leader or deputy can accept applications" });
    }

    const application = await prisma.clanApplication.findFirst({
      where: { clanId, characterId: targetCharacterId, status: "pending" },
    });
    if (!application) {
      return reply.code(404).send({ error: "application not found" });
    }

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) return reply.code(404).send({ error: "clan not found" });

    const targetChar = await prisma.character.findUnique({
      where: { id: targetCharacterId },
      select: { name: true },
    });
    if (!targetChar) return reply.code(404).send({ error: "player not found" });

    const memberCount = await prisma.clanMember.count({ where: { clanId } });
    const maxMembers = clan.level >= 8 ? 80 : clan.level >= 7 ? 70 : clan.level >= 6 ? 60 : clan.level >= 5 ? 50 : clan.level >= 4 ? 40 : clan.level >= 3 ? 30 : clan.level >= 2 ? 20 : 10;
    if (memberCount >= maxMembers) {
      return reply.code(400).send({ error: "clan is full" });
    }

    const alreadyMember = await prisma.clanMember.findFirst({
      where: { characterId: targetCharacterId },
    });
    if (alreadyMember) {
      await prisma.clanApplication.update({
        where: { id: application.id },
        data: { status: "declined" },
      });
      return reply.code(400).send({ error: "player already in a clan" });
    }

    await prisma.$transaction([
      prisma.clanApplication.update({
        where: { id: application.id },
        data: { status: "accepted" },
      }),
      prisma.clanMember.create({
        data: {
          clanId,
          characterId: targetCharacterId,
        },
      }),
      prisma.clanLog.create({
        data: {
          clanId,
          type: "member_joined",
          characterId: character.id,
          targetCharacterId,
          message: `${targetChar.name} принят в клан по заявке`,
        },
      }),
    ]);

    return { ok: true };
  });

  // POST /clans/:id/applications/:characterId/decline
  app.post("/clans/:id/applications/:characterId/decline", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const canManage = await canManageClan(clanId, character.id);
    if (!canManage) {
      return reply.code(403).send({ error: "only leader or deputy can decline applications" });
    }

    const application = await prisma.clanApplication.findFirst({
      where: { clanId, characterId: targetCharacterId, status: "pending" },
    });
    if (!application) {
      return reply.code(404).send({ error: "application not found" });
    }

    await prisma.clanApplication.update({
      where: { id: application.id },
      data: { status: "declined" },
    });

    return { ok: true };
  });
}
