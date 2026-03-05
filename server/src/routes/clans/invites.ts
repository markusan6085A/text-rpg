import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { getAuth } from "../character/auth";
import { canManageClan } from "./helpers";

/** Реєстрація роутів invite: invite, my invites, respond */
export function registerClanInviteRoutes(app: FastifyInstance) {
  // GET /clans/invites/mine — мої pending запрошення (до /clans/:id)
  app.get("/clans/invites/mine", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const invites = await prisma.clanInvite.findMany({
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
      invites: invites.map((i) => ({
        id: i.id,
        clanId: i.clanId,
        clanName: i.clan.name,
        clanLevel: i.clan.level,
        clanEmblem: i.clan.emblem,
        invitedBy: i.invitedBy,
        createdAt: i.createdAt,
      })),
    };
  });

  // POST /clans/invites/:id/respond — прийняти/відхилити запрошення
  app.post("/clans/invites/:id/respond", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: inviteId } = req.params as { id: string };
    const { accept } = req.body as { accept?: boolean };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const invite = await prisma.clanInvite.findUnique({
      where: { id: inviteId },
      include: { clan: true },
    });

    if (!invite || invite.characterId !== character.id) {
      return reply.code(404).send({ error: "invite not found" });
    }

    if (invite.status !== "pending") {
      return reply.code(400).send({ error: "invite already responded" });
    }

    const alreadyInClan = await prisma.clanMember.findFirst({
      where: { characterId: character.id },
    });
    if (alreadyInClan) {
      await prisma.clanInvite.update({
        where: { id: inviteId },
        data: { status: "declined" },
      });
      return reply.code(400).send({ error: "you already belong to a clan" });
    }

    if (accept) {
      const memberCount = await prisma.clanMember.count({
        where: { clanId: invite.clanId },
      });
      const maxMembers = invite.clan.level >= 8 ? 80 : invite.clan.level >= 7 ? 70 : invite.clan.level >= 6 ? 60 : invite.clan.level >= 5 ? 50 : invite.clan.level >= 4 ? 40 : invite.clan.level >= 3 ? 30 : invite.clan.level >= 2 ? 20 : 10;
      if (memberCount >= maxMembers) {
        await prisma.clanInvite.update({
          where: { id: inviteId },
          data: { status: "declined" },
        });
        return reply.code(400).send({ error: "clan is full" });
      }

      await prisma.$transaction([
        prisma.clanInvite.update({
          where: { id: inviteId },
          data: { status: "accepted" },
        }),
        prisma.clanMember.create({
          data: {
            clanId: invite.clanId,
            characterId: character.id,
          },
        }),
        prisma.clanLog.create({
          data: {
            clanId: invite.clanId,
            type: "member_joined",
            characterId: character.id,
            message: `${character.name} вступил в клан по приглашению`,
          },
        }),
      ]);
    } else {
      await prisma.clanInvite.update({
        where: { id: inviteId },
        data: { status: "declined" },
      });
    }

    return { ok: true, accepted: !!accept };
  });
}

/** Реєстрація вкладених invite-роутів для /clans/:id/invite */
export function registerClanInviteNestedRoutes(app: FastifyInstance) {
  // POST /clans/:id/invite — лідер/зам запрошує гравця
  app.post("/clans/:id/invite", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId } = req.params as { id: string };
    const { characterId: targetCharacterId } = req.body as { characterId?: string };

    if (!targetCharacterId) {
      return reply.code(400).send({ error: "characterId is required" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const canManage = await canManageClan(clanId, character.id);
    if (!canManage) {
      return reply.code(403).send({ error: "only leader or deputy can invite" });
    }

    if (targetCharacterId === character.id) {
      return reply.code(400).send({ error: "cannot invite yourself" });
    }

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) return reply.code(404).send({ error: "clan not found" });

    const targetCharacter = await prisma.character.findUnique({
      where: { id: targetCharacterId },
      select: { id: true, name: true },
    });
    if (!targetCharacter) return reply.code(404).send({ error: "player not found" });

    const alreadyMember = await prisma.clanMember.findFirst({
      where: { characterId: targetCharacterId },
    });
    if (alreadyMember) {
      return reply.code(400).send({ error: "player already in a clan" });
    }

    const memberCount = await prisma.clanMember.count({
      where: { clanId },
    });
    const maxMembers = clan.level >= 8 ? 80 : clan.level >= 7 ? 70 : clan.level >= 6 ? 60 : clan.level >= 5 ? 50 : clan.level >= 4 ? 40 : clan.level >= 3 ? 30 : clan.level >= 2 ? 20 : 10;
    if (memberCount >= maxMembers) {
      return reply.code(400).send({ error: "clan is full" });
    }

    try {
      const invite = await prisma.clanInvite.upsert({
        where: {
          clanId_characterId: { clanId, characterId: targetCharacterId },
        },
        create: {
          clanId,
          characterId: targetCharacterId,
          invitedBy: character.id,
          status: "pending",
        },
        update: { status: "pending", invitedBy: character.id },
      });

      return { ok: true, invite: { id: invite.id } };
    } catch (e: any) {
      if (e.code === "P2002") {
        return reply.code(409).send({ error: "invite already sent" });
      }
      throw e;
    }
  });
}
