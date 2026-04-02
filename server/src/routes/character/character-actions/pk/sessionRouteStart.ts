import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import type { PkSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb } from "./store";
import { buildPkFighter, getLocation, isOnline, serializePkSession } from "./helpers";
export function registerPkSessionStartRoute(app: FastifyInstance): void {
  app.post("/characters/pk/session/start", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    await cleanupPkSessions();

    const body = (req.body ?? {}) as {
      attackerId?: string;
      targetId?: string;
      attackerHp?: number;
      attackerMaxHp?: number;
      attackerMp?: number;
      attackerMaxMp?: number;
    };
    const attackerId = String(body.attackerId ?? "").trim();
    const targetId = String(body.targetId ?? "").trim();
    if (!attackerId || !targetId) return reply.code(400).send({ error: "attackerId and targetId are required" });
    if (attackerId === targetId) return reply.code(400).send({ error: "self pk is not allowed" });

    let chars: Array<{
      id: string;
      accountId: string;
      name: string;
      level: number;
      heroJson: unknown;
      lastActivityAt?: Date | null;
      updatedAt?: Date | null;
    }> = [];
    try {
      chars = await prisma.character.findMany({
        where: { id: { in: [attackerId, targetId] } },
        select: { id: true, accountId: true, name: true, level: true, heroJson: true, lastActivityAt: true, updatedAt: true },
      });
    } catch {
      chars = await prisma.character.findMany({
        where: { id: { in: [attackerId, targetId] } },
        select: { id: true, accountId: true, name: true, level: true, heroJson: true, updatedAt: true },
      });
    }
    if (chars.length !== 2) return reply.code(404).send({ error: "character not found" });
    const attackerChar = chars.find((c) => c.id === attackerId);
    const defenderChar = chars.find((c) => c.id === targetId);
    if (!attackerChar || !defenderChar) return reply.code(404).send({ error: "character not found" });
    if (attackerChar.accountId !== auth.accountId) return reply.code(403).send({ error: "attacker does not belong to current account" });
    if (!isOnline(attackerChar.lastActivityAt, attackerChar.updatedAt) || !isOnline(defenderChar.lastActivityAt, defenderChar.updatedAt)) {
      return reply.code(400).send({ error: "both players must be online" });
    }

    const attackerLoc = getLocation(attackerChar.heroJson as any);
    const defenderLoc = getLocation(defenderChar.heroJson as any);
    if (!attackerLoc || attackerLoc !== defenderLoc) return reply.code(400).send({ error: "players must be in the same zone" });

    const diff = Math.abs((attackerChar.level || 1) - (defenderChar.level || 1));
    if (diff > 20) {
      return reply.code(400).send({ error: "Нельзя атаковать игрока, если разница уровней больше 20!" });
    }

    try {
      const existingRows = await prisma.$queryRawUnsafe<Array<{ payload: unknown }>>(
        `SELECT "payload" FROM "PkSessionStore" 
         WHERE "expiresAt" >= $1 
           AND ("payload"->>'ended')::boolean = false 
           AND (
             ("payload"->>'attackerId' = $2 AND "payload"->>'defenderId' = $3) OR 
             ("payload"->>'attackerId' = $3 AND "payload"->>'defenderId' = $2)
           ) 
         LIMIT 1`,
        Date.now(),
        attackerId,
        targetId
      );
      if (existingRows.length > 0 && existingRows[0]?.payload) {
        const parsed = typeof existingRows[0].payload === "string" ? JSON.parse(existingRows[0].payload as string) : existingRows[0].payload;
        const existingSession = parsed as PkSession;
        pkSessions.set(existingSession.id, existingSession);
        return reply.send(serializePkSession(existingSession));
      }
    } catch {
      // ignore
    }

    const sessionId = randomUUID();
    const session: PkSession = {
      id: sessionId,
      attackerId,
      defenderId: targetId,
      startLocation: attackerLoc,
      attacker: buildPkFighter(attackerChar),
      defender: buildPkFighter(defenderChar),
      attackerCooldowns: {},
      defenderCooldowns: {},
      log: [`PK бой начат: ${attackerChar.name} vs ${defenderChar.name}`],
      ended: false,
      attackerHasHit: false,
      defenderHasHit: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      saved: false,
    };
    if (typeof body.attackerMaxHp === "number" && body.attackerMaxHp >= 1) {
      session.attacker.maxHp = body.attackerMaxHp;
      if (typeof body.attackerHp === "number" && body.attackerHp >= 0)
        session.attacker.hp = Math.min(body.attackerHp, session.attacker.maxHp);
    }
    if (typeof body.attackerMaxMp === "number" && body.attackerMaxMp >= 0) {
      session.attacker.maxMp = body.attackerMaxMp;
      if (typeof body.attackerMp === "number" && body.attackerMp >= 0)
        session.attacker.mp = Math.min(body.attackerMp, session.attacker.maxMp);
    }
    pkSessions.set(sessionId, session);
    await savePkSessionToDb(session);
    return reply.send(serializePkSession(session));
  });
}
