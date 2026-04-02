import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import type { PkSession } from "./types";
import { isArenaLikeSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import { buildPkFighter, getLocation, isOnline, serializePkSession } from "./helpers";
import {
  arenaField,
  ARENA_FIELD_MAX,
  pruneArenaField,
  hasActiveArenaSession,
  enrichArenaFieldPlayers,
} from "./arenaFieldState";
export function registerPkArenaHttpRoutes(app: FastifyInstance): void {
  app.get("/arena/field", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();
    pruneArenaField();
    const characterId = String((req.query as { characterId?: string })?.characterId ?? "").trim();
    if (characterId) {
      const ch = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true },
      });
      if (ch && arenaField.has(characterId)) {
        arenaField.get(characterId)!.lastSeen = Date.now();
      }
    }
    const players = await enrichArenaFieldPlayers();
    return reply.send({ ok: true, players, count: players.length });
  });

  app.post("/arena/field/join", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();
    pruneArenaField();
    const body = (req.body ?? {}) as { characterId?: string };
    const characterId = String(body.characterId ?? "").trim();
    if (!characterId) return reply.code(400).send({ error: "characterId required" });

    const meChar = await prisma.character.findFirst({
      where: { id: characterId, accountId: auth.accountId },
      select: { id: true, name: true, level: true, heroJson: true, lastActivityAt: true, updatedAt: true },
    });
    if (!meChar) return reply.code(404).send({ error: "character not found" });
    if (!isOnline(meChar.lastActivityAt as any, meChar.updatedAt as any)) {
      return reply.code(400).send({ error: "must be online" });
    }
    if (await hasActiveArenaSession(characterId)) {
      return reply.code(400).send({ error: "already in arena battle" });
    }
    if (arenaField.size >= ARENA_FIELD_MAX && !arenaField.has(characterId)) {
      return reply.code(503).send({ error: "arena field is full, try later" });
    }

    const now = Date.now();
    const name = String(meChar.name || "").trim() || "Игрок";
    const level = Math.max(1, Number(meChar.level || 1));
    arenaField.set(characterId, {
      accountId: auth.accountId,
      name,
      level,
      lastSeen: now,
    });

    const players = await enrichArenaFieldPlayers();
    return reply.send({ ok: true, players, count: arenaField.size });
  });

  app.post("/arena/field/leave", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body ?? {}) as { characterId?: string };
    const characterId = String(body.characterId ?? "").trim();
    if (characterId) {
      const ch = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true },
      });
      if (ch) arenaField.delete(characterId);
    } else {
      for (const [cid, e] of [...arenaField.entries()]) {
        if (e.accountId === auth.accountId) arenaField.delete(cid);
      }
    }
    pruneArenaField();
    const players = await enrichArenaFieldPlayers();
    return reply.send({ ok: true, players, count: arenaField.size });
  });

  /** Активный бой арены для персонажа (чтобы защитник сам открыл матч без «принять»). */
  app.get("/arena/active-session", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();
    const characterId = String((req.query as { characterId?: string })?.characterId ?? "").trim();
    if (!characterId) return reply.code(400).send({ error: "characterId required" });
    const ch = await prisma.character.findFirst({
      where: { id: characterId, accountId: auth.accountId },
      select: { id: true },
    });
    if (!ch) return reply.code(403).send({ error: "forbidden" });

    for (const s of pkSessions.values()) {
      if (!s.ended && isArenaLikeSession(s) && (s.attackerId === characterId || s.defenderId === characterId)) {
        return reply.send({ ok: true, sessionId: s.id });
      }
    }
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "PkSessionStore" 
         WHERE "expiresAt" >= $1 
           AND ("payload"->>'ended')::boolean = false 
           AND COALESCE("payload"->>'sessionKind','') IN ('arena','tvt')
           AND (("payload"->>'attackerId' = $2) OR ("payload"->>'defenderId' = $2)) 
         LIMIT 1`,
        Date.now(),
        characterId
      );
      if (rows[0]?.id) {
        return reply.send({ ok: true, sessionId: rows[0].id });
      }
    } catch {
      /* ignore */
    }
    return reply.send({ ok: true, sessionId: null });
  });

  app.post("/arena/challenge", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();
    pruneArenaField();

    const body = (req.body ?? {}) as {
      characterId?: string;
      targetId?: string;
      attackerHp?: number;
      attackerMaxHp?: number;
      attackerMp?: number;
      attackerMaxMp?: number;
    };
    const characterId = String(body.characterId ?? "").trim();
    const targetId = String(body.targetId ?? "").trim();
    if (!characterId || !targetId) return reply.code(400).send({ error: "characterId and targetId required" });
    if (characterId === targetId) return reply.code(400).send({ error: "cannot challenge yourself" });

    const attackerChar = await prisma.character.findFirst({
      where: { id: characterId, accountId: auth.accountId },
      select: { id: true, name: true, level: true, heroJson: true, lastActivityAt: true, updatedAt: true },
    });
    if (!attackerChar) return reply.code(403).send({ error: "attacker does not belong to current account" });

    if (!arenaField.has(characterId)) {
      return reply.code(400).send({ error: "Сначала выйдите на поле арены" });
    }
    if (!arenaField.has(targetId)) {
      return reply.code(400).send({ error: "Игрок сбежал" });
    }

    let defenderRows: Array<{
      id: string;
      name: string;
      level: number;
      heroJson: unknown;
      lastActivityAt?: Date | null;
      updatedAt?: Date | null;
    }> = [];
    try {
      defenderRows = await prisma.character.findMany({
        where: { id: targetId },
        select: { id: true, name: true, level: true, heroJson: true, lastActivityAt: true, updatedAt: true },
      });
    } catch {
      defenderRows = await prisma.character.findMany({
        where: { id: targetId },
        select: { id: true, name: true, level: true, heroJson: true, updatedAt: true },
      });
    }
    const defenderChar = defenderRows[0];
    if (!defenderChar) return reply.code(404).send({ error: "target not found" });

    if (!isOnline(attackerChar.lastActivityAt as any, attackerChar.updatedAt as any)) {
      return reply.code(400).send({ error: "you must be online" });
    }
    if (!isOnline(defenderChar.lastActivityAt as any, defenderChar.updatedAt as any)) {
      return reply.code(400).send({ error: "opponent is offline" });
    }

    const diff = Math.abs((attackerChar.level || 1) - (defenderChar.level || 1));
    if (diff > 20) {
      return reply.code(400).send({ error: "Нельзя атаковать: разница уровней больше 20!" });
    }

    if (await hasActiveArenaSession(characterId) || (await hasActiveArenaSession(targetId))) {
      return reply.code(400).send({ error: "one of you is already in an arena fight" });
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
        characterId,
        targetId
      );
      if (existingRows.length > 0 && existingRows[0]?.payload) {
        const parsed = typeof existingRows[0].payload === "string" ? JSON.parse(existingRows[0].payload as string) : existingRows[0].payload;
        const existingSession = parsed as PkSession;
        pkSessions.set(existingSession.id, existingSession);
        arenaField.delete(characterId);
        arenaField.delete(targetId);
        return reply.send({
          ok: true,
          sessionId: existingSession.id,
          session: serializePkSession(existingSession).session,
        });
      }
    } catch {
      // ignore
    }

    const now = Date.now();
    arenaField.delete(characterId);
    arenaField.delete(targetId);

    const newSessionId = randomUUID();
    const arenaSession: PkSession = {
      id: newSessionId,
      attackerId: characterId,
      defenderId: targetId,
      sessionKind: "arena",
      startLocation: "__arena__",
      attacker: buildPkFighter(attackerChar as any),
      defender: buildPkFighter(defenderChar as any),
      attackerCooldowns: {},
      defenderCooldowns: {},
      log: [`Арена: ${attackerChar.name} vs ${defenderChar.name}`],
      ended: false,
      attackerHasHit: false,
      defenderHasHit: false,
      createdAt: now,
      updatedAt: now,
      saved: false,
    };
    if (typeof body.attackerMaxHp === "number" && body.attackerMaxHp >= 1) {
      arenaSession.attacker.maxHp = body.attackerMaxHp;
      if (typeof body.attackerHp === "number" && body.attackerHp >= 0)
        arenaSession.attacker.hp = Math.min(body.attackerHp, arenaSession.attacker.maxHp);
    }
    if (typeof body.attackerMaxMp === "number" && body.attackerMaxMp >= 0) {
      arenaSession.attacker.maxMp = body.attackerMaxMp;
      if (typeof body.attackerMp === "number" && body.attackerMp >= 0)
        arenaSession.attacker.mp = Math.min(body.attackerMp, arenaSession.attacker.maxMp);
    }

    pkSessions.set(newSessionId, arenaSession);
    await savePkSessionToDb(arenaSession);

    const serialized = serializePkSession(arenaSession);
    return reply.send({
      ok: true,
      sessionId: newSessionId,
      session: serialized.session,
    });
  });
}
