import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import { isArenaLikeSession, isTvtSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import { serializePkSession, refreshPkFighterStatsFromDb } from "./helpers";
import { abortTvtMatchOnFlee } from "../tvt/engine";
export function registerPkSessionArenaFleeRoute(app: FastifyInstance): void {
  /** Уход с арены во время боя: соперник видит «… сбежал!», без победителя в таблице. */
  app.post("/characters/pk/session/:id/arena-flee", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();
    const sessionId = String((req.params as any)?.id ?? "").trim();
    let session = pkSessions.get(sessionId);
    if (!session) {
      session = await loadPkSessionFromDb(sessionId);
      if (session) pkSessions.set(sessionId, session);
    }
    if (!session) return reply.code(404).send({ error: "pk session not found" });
    if (!isArenaLikeSession(session)) return reply.code(400).send({ error: "not an arena session" });

    const me = await prisma.character.findFirst({
      where: {
        accountId: auth.accountId,
        id: { in: [session.attackerId, session.defenderId] as any },
      },
      select: { id: true, name: true },
    });
    if (!me) return reply.code(403).send({ error: "forbidden" });

    if (session.ended) {
      await refreshPkFighterStatsFromDb(session);
      return reply.send(serializePkSession(session));
    }

    const now = Date.now();
    const escapedName = String(me.name ?? "Игрок").trim() || "Игрок";
    session.ended = true;
    session.winnerId = undefined;
    session.escapedById = me.id;
    session.escapedByName = escapedName;
    session.log.unshift(`${escapedName} сбежал!`);
    session.log = session.log.slice(0, 30);
    session.updatedAt = now;

    const charsLive = await prisma.character.findMany({
      where: { id: { in: [session.attackerId, session.defenderId] } },
      select: { id: true, heroJson: true },
    });
    await prisma.$transaction(async (tx) => {
      const ids = [session.attackerId, session.defenderId].sort();
      await tx.$queryRawUnsafe(`SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`, ids[0], ids[1]);
      for (const c of charsLive) {
        const heroJson = ((c.heroJson as any) || {}) as any;
        const cleaned = addVersioning(
          {
            ...heroJson,
            pkIncoming: null,
            pkSyncUntil: 0,
            arenaSyncUntil: 0,
          },
          Number(heroJson.heroRevision ?? 0) || 0
        );
        await tx.character.update({
          where: { id: c.id },
          data: { heroJson: cleaned, lastActivityAt: new Date() },
        });
      }
    });
    await savePkSessionToDb(session);
    if (isTvtSession(session)) {
      await abortTvtMatchOnFlee(session);
    }
    await refreshPkFighterStatsFromDb(session);
    return reply.send(serializePkSession(session));
  });
}
