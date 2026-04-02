import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { isArenaLikeSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import { serializePkSession } from "./helpers";
import { syncPkRealtimeState, syncArenaHpOnly } from "./sync";
export function registerPkSessionSyncStatsRoute(app: FastifyInstance): void {
  app.post("/characters/pk/session/:id/sync-stats", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();
    const sessionId = String((req.params as any)?.id ?? "").trim();
    let session = await loadPkSessionFromDb(sessionId);
    if (session) pkSessions.set(sessionId, session);
    else session = pkSessions.get(sessionId);
    if (!session) return reply.code(404).send({ error: "pk session not found" });
    const me = await prisma.character.findFirst({
      where: {
        accountId: auth.accountId,
        id: { in: [session.attackerId, session.defenderId] as any },
      },
      select: { id: true, heroJson: true },
    });
    if (!me) return reply.code(403).send({ error: "forbidden" });
    const body = (req.body ?? {}) as { hp?: number; maxHp?: number; mp?: number; maxMp?: number; logMessage?: string };
    const isAttacker = me.id === session.attackerId;
    const fighter = isAttacker ? session.attacker : session.defender;
    if (typeof body.maxHp === "number" && body.maxHp >= 1) {
      fighter.maxHp = body.maxHp;
      if (typeof body.hp === "number" && body.hp >= 0) fighter.hp = Math.min(body.hp, fighter.maxHp);
    } else if (typeof body.hp === "number" && body.hp >= 0) fighter.hp = Math.min(body.hp, fighter.maxHp);
    if (typeof body.maxMp === "number" && body.maxMp >= 0) {
      fighter.maxMp = body.maxMp;
      if (typeof body.mp === "number" && body.mp >= 0) fighter.mp = Math.min(body.mp, fighter.maxMp);
    } else if (typeof body.mp === "number" && body.mp >= 0) fighter.mp = Math.min(body.mp, fighter.maxMp);

    if (body.logMessage) {
      session.log.unshift(`${fighter.name} ${body.logMessage}`);
      session.log = session.log.slice(0, 30);
    }

    session.updatedAt = Date.now();
    await savePkSessionToDb(session);

    if (session.defenderId !== me.id) {
      session.attacker.hp = fighter.hp;
      session.attacker.mp = fighter.mp;
      session.attacker.maxHp = fighter.maxHp;
      session.attacker.maxMp = fighter.maxMp;
    } else {
      session.defender.hp = fighter.hp;
      session.defender.mp = fighter.mp;
      session.defender.maxHp = fighter.maxHp;
      session.defender.maxMp = fighter.maxMp;
    }

    try {
      if (
        body.logMessage ||
        typeof body.hp === "number" ||
        typeof body.mp === "number" ||
        typeof body.maxHp === "number" ||
        typeof body.maxMp === "number"
      ) {
        if (isArenaLikeSession(session)) {
          await syncArenaHpOnly(session, Date.now());
        } else {
          await syncPkRealtimeState(session, isAttacker ? "attacker" : "defender", Date.now());
        }
      }
    } catch (e: any) {
      if (e?.code === "P2025" || String(e).includes("revision_conflict") || String(e).includes("Character was modified")) {
        return reply.send(serializePkSession(session));
      } else {
        throw e;
      }
    }

    return reply.send(serializePkSession(session));
  });
}
