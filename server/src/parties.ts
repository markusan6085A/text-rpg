import type { FastifyInstance } from "fastify";
import { prisma } from "./db";
import { getAuth } from "./routes/character/auth";
import { addVersioning } from "./heroJsonValidator";
import { RateLimiter, getRateLimitKey } from "./rateLimiter";

const PARTY_MAX = 5;
const killShareLimiter = new RateLimiter(60 * 1000, 90);

async function getMyCharacter(accountId: string) {
  return prisma.character.findFirst({ where: { accountId } });
}

/** Частка для кожного з (N−1) членів пати (не вбивця); вбивця отримує base − each·(N−1) на клієнті. */
function nonKillerEach(base: number, n: number): number {
  const b = Math.max(0, Math.floor(base));
  if (n <= 1) return 0;
  return Math.floor(b / n);
}

async function ensurePartyForInviter(inviterId: string) {
  const existing = await prisma.partyMember.findUnique({
    where: { characterId: inviterId },
    include: { party: true },
  });
  if (existing) return existing.party;

  const party = await prisma.party.create({
    data: {
      leaderCharacterId: inviterId,
      members: { create: { characterId: inviterId } },
    },
  });
  return party;
}

async function patchCharacterProgress(
  characterId: string,
  dExp: number,
  dSp: number,
  dAdena: number
): Promise<void> {
  if (dExp === 0 && dSp === 0 && dAdena === 0) return;

  const char = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true, exp: true, sp: true, adena: true, heroJson: true },
  });
  if (!char) return;

  const hj = (char.heroJson as Record<string, unknown>) || {};
  const curHjExp = Math.floor(Number(hj.exp ?? char.exp));
  const curHjSp = Math.floor(Number(hj.sp ?? char.sp));
  const curHjAdena = Math.floor(Number(hj.adena ?? char.adena));
  const oldRev = Number(hj.heroRevision ?? 0) || 0;

  const nextExp = Math.max(0, Number(char.exp) + dExp);
  const nextSp = Math.max(0, char.sp + dSp);
  const nextAdena = Math.max(0, Number(char.adena) + dAdena);

  await prisma.character.update({
    where: { id: characterId },
    data: {
      exp: BigInt(Math.floor(nextExp)),
      sp: nextSp,
      adena: BigInt(Math.floor(nextAdena)),
      heroJson: addVersioning(
        {
          ...hj,
          exp: Math.max(0, curHjExp + dExp),
          sp: Math.max(0, curHjSp + dSp),
          adena: Math.max(0, curHjAdena + dAdena),
        } as object,
        oldRev
      ),
    },
  });
}

export async function partiesRoutes(app: FastifyInstance) {
  // GET /parties/current
  app.get("/current", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const membership = await prisma.partyMember.findUnique({
      where: { characterId: me.id },
      include: {
        party: {
          include: {
            members: {
              include: { character: { select: { id: true, name: true, level: true } } },
            },
          },
        },
      },
    });

    if (!membership) {
      return { ok: true, party: null };
    }

    const { party } = membership;
    return {
      ok: true,
      party: {
        id: party.id,
        leaderCharacterId: party.leaderCharacterId,
        members: party.members.map((m) => ({
          characterId: m.character.id,
          name: m.character.name,
          level: m.character.level,
        })),
      },
    };
  });

  // GET /parties/invites/mine
  app.get("/invites/mine", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const invites = await prisma.partyInvite.findMany({
      where: { toCharacterId: me.id, status: "pending" },
      include: {
        party: {
          include: {
            members: {
              include: { character: { select: { id: true, name: true } } },
            },
          },
        },
        fromCharacter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      ok: true,
      invites: invites.map((i) => ({
        id: i.id,
        partyId: i.partyId,
        fromCharacterId: i.fromCharacterId,
        fromName: i.fromCharacter.name,
        createdAt: i.createdAt,
        partySize: i.party.members.length,
      })),
    };
  });

  // POST /parties/invite  { targetCharacterId }
  app.post("/invite", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const { targetCharacterId } = (req.body || {}) as { targetCharacterId?: string };
    if (!targetCharacterId || targetCharacterId === me.id) {
      return reply.code(400).send({ error: "invalid input" });
    }

    const target = await prisma.character.findUnique({
      where: { id: targetCharacterId },
      select: { id: true },
    });
    if (!target) return reply.code(404).send({ error: "not found" });

    const targetBusy = await prisma.partyMember.findUnique({
      where: { characterId: targetCharacterId },
    });
    if (targetBusy) {
      return reply.code(400).send({ error: "forbidden" });
    }

    const party = await ensurePartyForInviter(me.id);
    const count = await prisma.partyMember.count({ where: { partyId: party.id } });
    if (count >= PARTY_MAX) {
      return reply.code(400).send({ error: "forbidden" });
    }

    const invite = await prisma.partyInvite.upsert({
      where: {
        partyId_toCharacterId: { partyId: party.id, toCharacterId: targetCharacterId },
      },
      create: {
        partyId: party.id,
        fromCharacterId: me.id,
        toCharacterId: targetCharacterId,
        status: "pending",
      },
      update: { fromCharacterId: me.id, status: "pending" },
    });

    return { ok: true, invite: { id: invite.id } };
  });

  // POST /parties/invites/:id/respond  { accept: boolean }
  app.post<{ Params: { id: string } }>("/invites/:id/respond", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const inviteId = String(req.params.id || "").trim();
    const { accept } = (req.body || {}) as { accept?: boolean };
    if (!inviteId || typeof accept !== "boolean") {
      return reply.code(400).send({ error: "invalid input" });
    }

    const invite = await prisma.partyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.toCharacterId !== me.id) {
      return reply.code(404).send({ error: "not found" });
    }

    if (invite.status !== "pending") {
      return reply.code(400).send({ error: "invalid input" });
    }

    if (!accept) {
      await prisma.partyInvite.update({
        where: { id: inviteId },
        data: { status: "declined" },
      });
      return { ok: true, accepted: false };
    }

    const inParty = await prisma.partyMember.findUnique({ where: { characterId: me.id } });
    if (inParty) {
      return reply.code(400).send({ error: "forbidden" });
    }

    const memberCount = await prisma.partyMember.count({ where: { partyId: invite.partyId } });
    if (memberCount >= PARTY_MAX) {
      await prisma.partyInvite.update({
        where: { id: inviteId },
        data: { status: "declined" },
      });
      return reply.code(400).send({ error: "forbidden" });
    }

    await prisma.$transaction([
      prisma.partyInvite.update({
        where: { id: inviteId },
        data: { status: "accepted" },
      }),
      prisma.partyMember.create({
        data: { partyId: invite.partyId, characterId: me.id },
      }),
      prisma.partyInvite.updateMany({
        where: {
          toCharacterId: me.id,
          status: "pending",
          id: { not: inviteId },
        },
        data: { status: "declined" },
      }),
    ]);

    return { ok: true, accepted: true };
  });

  // POST /parties/leave
  app.post("/leave", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const membership = await prisma.partyMember.findUnique({
      where: { characterId: me.id },
      include: { party: true },
    });
    if (!membership) {
      return reply.code(400).send({ error: "invalid input" });
    }

    const { partyId } = membership;
    const wasLeader = membership.party.leaderCharacterId === me.id;

    await prisma.partyMember.delete({ where: { id: membership.id } });

    const remaining = await prisma.partyMember.findMany({
      where: { partyId },
      orderBy: { joinedAt: "asc" },
    });

    if (remaining.length === 0) {
      await prisma.party.delete({ where: { id: partyId } });
    } else if (wasLeader) {
      const newLeader = remaining[0].characterId;
      await prisma.party.update({
        where: { id: partyId },
        data: { leaderCharacterId: newLeader },
      });
    }

    return { ok: true };
  });

  // POST /parties/kick  { characterId }
  app.post("/kick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const { characterId: targetId } = (req.body || {}) as { characterId?: string };
    if (!targetId || targetId === me.id) {
      return reply.code(400).send({ error: "invalid input" });
    }

    const myMembership = await prisma.partyMember.findUnique({
      where: { characterId: me.id },
      include: { party: true },
    });
    if (!myMembership || myMembership.party.leaderCharacterId !== me.id) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const victim = await prisma.partyMember.findUnique({
      where: { characterId: targetId },
    });
    if (!victim || victim.partyId !== myMembership.partyId) {
      return reply.code(404).send({ error: "not found" });
    }

    await prisma.partyMember.delete({ where: { id: victim.id } });

    const left = await prisma.partyMember.count({ where: { partyId: myMembership.partyId } });
    if (left === 0) {
      await prisma.party.delete({ where: { id: myMembership.partyId } });
    }

    return { ok: true };
  });

  /**
   * POST /parties/kill-share
   * Убивця вже отримує свою частку локально + PUT; тут лише інші члени пати (сервер).
   * Локацію не перевіряємо.
   */
  app.post("/kill-share", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const key = getRateLimitKey(req, "partyKillShare");
    const lim = killShareLimiter.check(key);
    if (!lim.allowed) return reply.code(429).send({ error: "rate limited" });

    const me = await getMyCharacter(auth.accountId);
    if (!me) return reply.code(404).send({ error: "character not found" });

    const body = (req.body || {}) as {
      baseExp?: number;
      baseSp?: number;
      baseAdena?: number;
    };
    let baseExp = Math.max(0, Math.floor(Number(body.baseExp ?? 0)));
    let baseSp = Math.max(0, Math.floor(Number(body.baseSp ?? 0)));
    let baseAdena = Math.max(0, Math.floor(Number(body.baseAdena ?? 0)));

    baseExp = Math.min(baseExp, 5_000_000);
    baseSp = Math.min(baseSp, 2_000_000);
    baseAdena = Math.min(baseAdena, 500_000_000);

    const membership = await prisma.partyMember.findUnique({
      where: { characterId: me.id },
      include: { party: { include: { members: true } } },
    });

    if (!membership) {
      return reply.code(400).send({ error: "invalid input" });
    }

    const members = membership.party.members;
    const n = members.length;
    if (n <= 1) {
      return { ok: true, applied: 0 };
    }

    const eEach = nonKillerEach(baseExp, n);
    const sEach = nonKillerEach(baseSp, n);
    const aEach = nonKillerEach(baseAdena, n);

    let applied = 0;
    for (const m of members) {
      if (m.characterId === me.id) continue;
      await patchCharacterProgress(m.characterId, eEach, sEach, aEach);
      applied++;
    }

    return { ok: true, applied, partySize: n };
  });
}
