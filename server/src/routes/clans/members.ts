import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { getAuth } from "../character/auth";
import { getClanRole } from "./helpers";

/** Реєстрація роутів members: leave, transfer leadership */
export function registerClanMemberNestedRoutes(app: FastifyInstance) {
  // POST /clans/:id/leave — вийти з клану
  app.post("/clans/:id/leave", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId } = req.params as { id: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
      select: { creatorId: true },
    });
    if (!clan) return reply.code(404).send({ error: "clan not found" });

    if (clan.creatorId === character.id) {
      return reply.code(400).send({
        error: "leader cannot leave; use transfer leadership first or delete clan",
      });
    }

    const member = await prisma.clanMember.findFirst({
      where: { clanId, characterId: character.id },
      include: { character: { select: { name: true } } },
    });
    if (!member) {
      return reply.code(404).send({ error: "you are not a member of this clan" });
    }

    await prisma.$transaction([
      prisma.clanMember.delete({
        where: { id: member.id },
      }),
      prisma.clanLog.create({
        data: {
          clanId,
          type: "member_left",
          characterId: character.id,
          message: `${character.name} вышел из клана`,
        },
      }),
    ]);

    return { ok: true };
  });

  // POST /clans/:id/transfer — передати лідерство іншому члену
  app.post("/clans/:id/transfer", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id: clanId } = req.params as { id: string };
    const { characterId: newLeaderId } = req.body as { characterId?: string };

    if (!newLeaderId) {
      return reply.code(400).send({ error: "characterId is required" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const role = await getClanRole(clanId, character.id);
    if (role !== "leader") {
      return reply.code(403).send({ error: "only clan leader can transfer leadership" });
    }

    if (newLeaderId === character.id) {
      return reply.code(400).send({ error: "cannot transfer to yourself" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        creator: { select: { name: true } },
      },
    });
    if (!clan) return reply.code(404).send({ error: "clan not found" });

    const newLeaderMember = await prisma.clanMember.findFirst({
      where: { clanId, characterId: newLeaderId },
      include: { character: { select: { name: true } } },
    });
    if (!newLeaderMember) {
      return reply.code(404).send({ error: "target is not a member of this clan" });
    }

    const oldLeaderMember = await prisma.clanMember.findFirst({
      where: { clanId, characterId: character.id },
    });

    await prisma.$transaction([
      prisma.clan.update({
        where: { id: clanId },
        data: { creatorId: newLeaderId },
      }),
      prisma.clanMember.update({
        where: { id: newLeaderMember.id },
        data: { isDeputy: false },
      }),
      ...(oldLeaderMember
        ? [
            prisma.clanMember.update({
              where: { id: oldLeaderMember.id },
              data: { isDeputy: true },
            }),
          ]
        : []),
      prisma.clanLog.create({
        data: {
          clanId,
          type: "leader_transferred",
          characterId: character.id,
          targetCharacterId: newLeaderId,
          message: `${clan.creator.name} передал лидерство ${newLeaderMember.character.name}`,
        },
      }),
    ]);

    return { ok: true };
  });
}
