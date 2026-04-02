import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import { isArenaLikeSession, isTvtSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import {
  ensurePkFighterElementalFields,
  getLocation,
  isOnline,
  serializePkSession,
  refreshPkFighterStatsFromDb,
} from "./helpers";
import { abortTvtMatchOnFlee } from "../tvt/engine";
export function registerPkSessionGetRoute(app: FastifyInstance): void {
  app.get("/characters/pk/session/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();

    const sessionId = String((req.params as any)?.id ?? "").trim();
    let session = await loadPkSessionFromDb(sessionId);
    if (session) pkSessions.set(sessionId, session);
    else session = pkSessions.get(sessionId);
    if (!session) return reply.code(404).send({ error: "pk session not found" });
    ensurePkFighterElementalFields(session.attacker);
    ensurePkFighterElementalFields(session.defender);

    const myChar = await prisma.character.findFirst({
      where: {
        id: { in: [session.attackerId, session.defenderId] as any },
        accountId: auth.accountId,
      },
      select: { id: true },
    });
    if (!myChar) return reply.code(403).send({ error: "forbidden" });

    if (!session.ended) {
      const now = Date.now();
      const charsLive = await prisma.character.findMany({
        where: { id: { in: [session.attackerId, session.defenderId] } },
        select: { id: true, name: true, heroJson: true, lastActivityAt: true, updatedAt: true },
      });
      const liveAttacker = charsLive.find((c) => c.id === session.attackerId);
      const liveDefender = charsLive.find((c) => c.id === session.defenderId);
      const baseLoc =
        String(session.startLocation ?? "").trim() ||
        getLocation(liveAttacker?.heroJson as any) ||
        getLocation(liveDefender?.heroJson as any);
      session.startLocation = baseLoc || session.startLocation;
      const attackerOnline = isOnline(liveAttacker?.lastActivityAt as any, liveAttacker?.updatedAt as any);
      const defenderOnline = isOnline(liveDefender?.lastActivityAt as any, liveDefender?.updatedAt as any);
      const attackerLocNow = attackerOnline ? getLocation(liveAttacker?.heroJson as any) : null;
      const defenderLocNow = defenderOnline ? getLocation(liveDefender?.heroJson as any) : null;
      const attackerEscaped = !!baseLoc && (!attackerLocNow || attackerLocNow !== baseLoc);
      const defenderEscaped = !!baseLoc && (!defenderLocNow || defenderLocNow !== baseLoc);
      const someoneEscaped = !attackerOnline || !defenderOnline || attackerEscaped || defenderEscaped;

      if (!isArenaLikeSession(session) && someoneEscaped) {
        const escapedChar = !defenderOnline || defenderEscaped ? liveDefender : liveAttacker;
        const escapedName = String(escapedChar?.name ?? "Игрок").trim() || "Игрок";
        session.ended = true;
        session.winnerId = undefined;
        session.escapedById = escapedChar?.id;
        session.escapedByName = escapedName;
        session.log.unshift(`${escapedName} сбежал!`);
        session.log = session.log.slice(0, 30);
        session.updatedAt = now;
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
      }
    }

    await refreshPkFighterStatsFromDb(session);
    return reply.send(serializePkSession(session));
  });
}
