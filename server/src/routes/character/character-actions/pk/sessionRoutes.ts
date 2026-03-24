import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import type { PkFighter, PkSession, PkSkill } from "./types";
import { isArenaSession } from "./types";
import {
  pkSessions,
  cleanupPkSessions,
  savePkSessionToDb,
  loadPkSessionFromDb,
} from "./store";
import {
  buildPkFighter,
  getLocation,
  isOnline,
  serializePkSession,
  refreshPkFighterStatsFromDb,
  computeDamage,
  getEffectivePkNickColor,
} from "./helpers";
import { syncPkRealtimeState, syncArenaHpOnly } from "./sync";
import { savePkResultIfNeeded, ensureArenaLeaderboardTable } from "./results";

export async function registerPkSessionRoutes(app: FastifyInstance) {
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
        if (isArenaSession(session)) {
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
    if (!isArenaSession(session)) return reply.code(400).send({ error: "not an arena session" });

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
    await refreshPkFighterStatsFromDb(session);
    return reply.send(serializePkSession(session));
  });

  app.get("/characters/pk/session/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();

    const sessionId = String((req.params as any)?.id ?? "").trim();
    let session = await loadPkSessionFromDb(sessionId);
    if (session) pkSessions.set(sessionId, session);
    else session = pkSessions.get(sessionId);
    if (!session) return reply.code(404).send({ error: "pk session not found" });

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

      if (!isArenaSession(session) && someoneEscaped) {
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
      }
    }

    await refreshPkFighterStatsFromDb(session);
    return reply.send(serializePkSession(session));
  });

  app.post("/characters/pk/session/:id/act", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();

    const sessionId = String((req.params as any)?.id ?? "").trim();
    const body = (req.body ?? {}) as {
      skillId?: number;
      isBuff?: boolean;
      isToggle?: boolean;
      name?: string;
      target?: string;
      shotMultiplier?: number;
      shotName?: string;
      buffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>;
      buffCooldownMs?: number;
      buffDurationSec?: number;
    };
    const skillId = body.skillId !== undefined ? Number(body.skillId) : undefined;
    const isBuff = body.isBuff;
    const isToggle = body.isToggle;
    const skillName = body.name;
    const shotMultiplier = typeof body.shotMultiplier === "number" ? body.shotMultiplier : 1.0;
    const shotName = body.shotName;
    const buffEffects = Array.isArray(body.buffEffects) ? body.buffEffects : [];
    const buffCooldownMs = typeof body.buffCooldownMs === "number" ? body.buffCooldownMs : undefined;
    const buffDurationSec = typeof body.buffDurationSec === "number" && body.buffDurationSec > 0 ? body.buffDurationSec : 120;

    let session = pkSessions.get(sessionId);
    if (!session) {
      session = await loadPkSessionFromDb(sessionId);
      if (session) pkSessions.set(sessionId, session);
    }
    if (!session) return reply.code(404).send({ error: "pk session not found" });

    const me = await prisma.character.findFirst({
      where: {
        accountId: auth.accountId,
        id: { in: [session.attackerId, session.defenderId] as any },
      },
      select: { id: true },
    });
    if (!me) return reply.code(403).send({ error: "forbidden" });
    if (session.ended) {
      await refreshPkFighterStatsFromDb(session);
      return reply.send(serializePkSession(session));
    }

    const now = Date.now();
    const actorRole: "attacker" | "defender" = me.id === session.attackerId ? "attacker" : "defender";

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
    const attackerLocNow = getLocation(liveAttacker?.heroJson as any);
    const defenderLocNow = getLocation(liveDefender?.heroJson as any);
    const attackerOnline = isOnline(liveAttacker?.lastActivityAt as any, liveAttacker?.updatedAt as any);
    const defenderOnline = isOnline(liveDefender?.lastActivityAt as any, liveDefender?.updatedAt as any);
    const attackerEscaped = !!baseLoc && attackerLocNow !== baseLoc;
    const defenderEscaped = !!baseLoc && defenderLocNow !== baseLoc;
    const someoneEscaped = !attackerOnline || !defenderOnline || attackerEscaped || defenderEscaped;
    if (!isArenaSession(session) && someoneEscaped) {
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
        const chars = await tx.character.findMany({
          where: { id: { in: [session.attackerId, session.defenderId] } },
          select: { id: true, heroJson: true },
        });
        for (const c of chars) {
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
      await refreshPkFighterStatsFromDb(session);
      return reply.send(serializePkSession(session));
    }

    const pickSkill = (fighter: PkFighter, cooldowns: Record<number, number>, requestedSkillId?: number): PkSkill | null => {
      if (requestedSkillId === undefined) return null;
      const requested = fighter.skills.find((s) => s.id === requestedSkillId);
      if (!requested) return null;
      if ((cooldowns[requested.id] ?? 0) > now) return null;
      if (fighter.mp < requested.mpCost) return null;
      return requested;
    };

    const applyBuffEffects = (
      fighter: PkFighter,
      effects: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>
    ) => {
      const statKeys = ["pAtk", "pDef", "mAtk", "mDef", "maxHp", "maxMp", "accuracy", "evasion", "crit", "mCrit", "critPower"];
      for (const e of effects) {
        const stat = String(e.stat || "").trim();
        if (!stat || !statKeys.includes(stat)) continue;
        const mode = String(e.mode || "flat").toLowerCase();
        const map: Record<string, number> = {
          pAtk: fighter.pAtk,
          pDef: fighter.pDef,
          mAtk: fighter.mAtk,
          mDef: fighter.mDef,
          maxHp: fighter.maxHp,
          maxMp: fighter.maxMp,
          accuracy: fighter.accuracy,
          evasion: fighter.evasion,
          crit: fighter.crit,
          mCrit: fighter.mCrit,
          critPower: fighter.critPower,
        };
        if (!(stat in map)) continue;
        let newVal = map[stat];
        if (mode === "percent" && typeof e.value === "number") {
          newVal = Math.round(newVal * (1 + e.value / 100));
        } else if (mode === "flat" && typeof e.value === "number") {
          newVal = Math.max(0, newVal + e.value);
        } else if (mode === "multiplier" && (typeof e.multiplier === "number" || typeof e.value === "number")) {
          const m = typeof e.multiplier === "number" ? e.multiplier : 1 + (e.value ?? 0) / 100;
          newVal = Math.round(newVal * m);
        }
        (fighter as any)[stat] = newVal;
      }
    };

    const doTurn = (
      attacker: PkFighter,
      defender: PkFighter,
      cooldowns: Record<number, number>,
      requestedSkillId?: number,
      reqIsBuff?: boolean,
      reqIsToggle?: boolean,
      reqSkillName?: string,
      reqShotMultiplier: number = 1.0,
      reqShotName?: string,
      reqBuffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>,
      reqBuffCooldownMs?: number
    ): number => {
      const skill = pickSkill(attacker, cooldowns, requestedSkillId);

      if ((reqIsBuff || reqIsToggle) && !skill) {
        const sName = reqSkillName || `skill#${requestedSkillId ?? "?"}`;
        const requested = requestedSkillId != null ? attacker.skills.find((s) => s.id === requestedSkillId) : null;
        if (requested && attacker.mp < requested.mpCost) {
          session.log.unshift(`${attacker.name}: не хватает MP для ${sName} (нужно ${requested.mpCost}).`);
        } else {
          session.log.unshift(`${attacker.name}: не удалось использовать ${sName}.`);
        }
        session.log = session.log.slice(0, 30);
        return 0;
      }

      if (skill && (reqIsBuff || reqIsToggle)) {
        attacker.mp = Math.max(0, attacker.mp - skill.mpCost);
        const cdMs = typeof reqBuffCooldownMs === "number" && reqBuffCooldownMs >= 0 ? reqBuffCooldownMs : skill.cooldownMs;
        cooldowns[skill.id] = now + cdMs;
        if (Array.isArray(reqBuffEffects) && reqBuffEffects.length > 0) {
          applyBuffEffects(attacker, reqBuffEffects);
        }
        const sName = reqSkillName || skill.name || `skill#${skill.id}`;
        if (reqIsToggle) {
          session.log.unshift(`${attacker.name} использует переключаемое умение ${sName}`);
        } else {
          session.log.unshift(`${attacker.name} использует бафф ${sName}`);
        }
        session.log = session.log.slice(0, 30);
        return 0;
      }

      const useMagic = skill ? attacker.prefersMagic : false;
      const powerBonus = skill?.powerBonus ?? 0;
      const { dmg, isCrit, isMiss } = computeDamage(attacker, defender, powerBonus, useMagic, reqShotMultiplier);
      defender.hp = Math.max(0, defender.hp - dmg);

      const critText = isCrit ? " (критический удар!)" : "";
      const shotText = reqShotName ? ` Используя ${reqShotName},` : "";

      if (isMiss) {
        session.log.unshift(`${attacker.name} промахивается по ${defender.name}!`);
      } else if (skill) {
        attacker.mp = Math.max(0, attacker.mp - skill.mpCost);
        cooldowns[skill.id] = now + skill.cooldownMs;
        const sName = reqSkillName || skill.name || `skill#${skill.id}`;
        session.log.unshift(`${attacker.name} использует ${sName}.${shotText} Наносит ${dmg} урона${critText}`);
      } else {
        session.log.unshift(`${attacker.name} атакует (простая атака).${shotText} Наносит ${dmg} урона${critText}`);
      }
      session.log = session.log.slice(0, 30);
      return dmg;
    };

    if (session.attackerHasHit === undefined) session.attackerHasHit = false;
    if (session.defenderHasHit === undefined) session.defenderHasHit = false;
    let appliedBuffTurn = false;
    if (actorRole === "attacker") {
      const dmg = doTurn(
        session.attacker,
        session.defender,
        session.attackerCooldowns,
        skillId,
        isBuff,
        isToggle,
        skillName,
        shotMultiplier,
        shotName,
        buffEffects,
        buffCooldownMs
      );
      appliedBuffTurn = !!(dmg === 0 && (isBuff || isToggle) && Array.isArray(buffEffects) && buffEffects.length > 0);
      session.lastHitDamage = dmg;
      session.lastHitById = session.attackerId;
      session.lastHitByName = session.attacker.name;
      session.attackerHasHit = true;

      if (session.defender.hp <= 0) {
        session.ended = true;
        session.winnerId = session.attackerId;
      }
    } else {
      const dmg = doTurn(
        session.defender,
        session.attacker,
        session.defenderCooldowns,
        skillId,
        isBuff,
        isToggle,
        skillName,
        shotMultiplier,
        shotName,
        buffEffects,
        buffCooldownMs
      );
      appliedBuffTurn = !!(dmg === 0 && (isBuff || isToggle) && Array.isArray(buffEffects) && buffEffects.length > 0);
      session.lastHitDamage = dmg;
      session.lastHitById = session.defenderId;
      session.lastHitByName = session.defender.name;
      session.defenderHasHit = true;

      if (session.attacker.hp <= 0) {
        session.ended = true;
        session.winnerId = session.defenderId;
      }
    }
    session.updatedAt = Date.now();

    let actorBuffs: any[] | undefined;
    if (appliedBuffTurn && skillId && skillName) {
      const actorId = actorRole === "attacker" ? session.attackerId : session.defenderId;
      const durationMs = buffDurationSec * 1000;
      const newBuff = {
        id: skillId,
        name: String(skillName || "").trim() || `skill#${skillId}`,
        icon: "",
        effects: buffEffects,
        expiresAt: now + durationMs,
        startedAt: now,
        durationMs,
        source: "skill" as const,
        buffGroup: undefined as string | undefined,
        stackType: undefined as string | undefined,
      };
      try {
        const targetChar = await prisma.character.findUnique({
          where: { id: actorId },
          select: { id: true, heroJson: true },
        });
        if (targetChar) {
          const heroJson = ((targetChar.heroJson as any) || {}) as any;
          const currentBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
          const filteredBuffs = currentBuffs.filter((b: any) => b.id !== skillId);
          const updatedBuffs = [...filteredBuffs, newBuff];
          const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
          const updatedHeroJson = addVersioning({ ...heroJson, heroBuffs: updatedBuffs }, oldRevision);
          await prisma.character.update({
            where: { id: actorId },
            data: { heroJson: updatedHeroJson },
          });
          actorBuffs = updatedBuffs;
        }
      } catch (e: any) {
        app.log?.warn?.(e, "[actPkSession] Failed to persist heroBuffs");
      }
    }

    if (isArenaSession(session)) {
      await syncArenaHpOnly(session, now);
    } else {
      await syncPkRealtimeState(session, actorRole, now);
    }
    await savePkResultIfNeeded(session);
    await savePkSessionToDb(session);
    await refreshPkFighterStatsFromDb(session);
    const response = serializePkSession(session);
    if (actorBuffs) (response as any).actorBuffs = actorBuffs;
    return reply.send(response);
  });

  /** Поле арени: багато гравців одночасно, бій починається вручну (challenge) */
  type ArenaFieldEntry = { accountId: string; name: string; level: number; lastSeen: number };
  const arenaField = new Map<string, ArenaFieldEntry>();
  const ARENA_FIELD_IDLE_MS = 50_000;
  const ARENA_FIELD_MAX = 200;

  function pruneArenaField() {
    const now = Date.now();
    for (const [id, e] of [...arenaField.entries()]) {
      if (now - e.lastSeen > ARENA_FIELD_IDLE_MS) arenaField.delete(id);
    }
  }

  async function hasActiveArenaSession(characterId: string): Promise<boolean> {
    for (const s of pkSessions.values()) {
      if (!s.ended && isArenaSession(s) && (s.attackerId === characterId || s.defenderId === characterId)) {
        return true;
      }
    }
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ payload: unknown }>>(
        `SELECT "payload" FROM "PkSessionStore" WHERE "expiresAt" >= $1 AND ("payload"->>'ended')::boolean = false AND (("payload"->>'attackerId' = $2) OR ("payload"->>'defenderId' = $2)) LIMIT 3`,
        Date.now(),
        characterId
      );
      for (const row of rows) {
        if (!row?.payload) continue;
        const p = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
        if (p && p.sessionKind === "arena") return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function fieldPlayersList(): Array<{ id: string; name: string; level: number }> {
    return [...arenaField.entries()].map(([id, v]) => ({
      id,
      name: v.name,
      level: v.level,
    }));
  }

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
    const players = fieldPlayersList();
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

    return reply.send({ ok: true, players: fieldPlayersList(), count: arenaField.size });
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
    return reply.send({ ok: true, players: fieldPlayersList(), count: arenaField.size });
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
      if (!s.ended && isArenaSession(s) && (s.attackerId === characterId || s.defenderId === characterId)) {
        return reply.send({ ok: true, sessionId: s.id });
      }
    }
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "PkSessionStore" 
         WHERE "expiresAt" >= $1 
           AND ("payload"->>'ended')::boolean = false 
           AND COALESCE("payload"->>'sessionKind','') = 'arena'
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

  app.get("/arena/leaderboard", async (_req, reply) => {
    await ensureArenaLeaderboardTable();
    try {
      const rows = await prisma.$queryRawUnsafe<
        Array<{ characterId: string; wins: number; losses: number; name: string | null; level: number | null }>
      >(
        `SELECT l."characterId", l."wins", l."losses", c."name", c."level"
         FROM "ArenaLeaderboard" l
         LEFT JOIN "Character" c ON c."id" = l."characterId"
         ORDER BY l."wins" DESC, l."losses" ASC, l."updatedAt" ASC
         LIMIT 10`
      );
      return reply.send({ ok: true, top: rows });
    } catch {
      return reply.send({ ok: true, top: [] });
    }
  });

  app.get("/pvp/stats", async (_req, reply) => {
    await ensureArenaLeaderboardTable();
    let arenaTop: Array<{ characterId: string; wins: number; losses: number; name: string | null; level: number | null }> = [];
    try {
      arenaTop = await prisma.$queryRawUnsafe(
        `SELECT l."characterId", l."wins", l."losses", c."name", c."level"
         FROM "ArenaLeaderboard" l
         LEFT JOIN "Character" c ON c."id" = l."characterId"
         ORDER BY l."wins" DESC, l."losses" ASC
         LIMIT 10`
      );
    } catch {
      arenaTop = [];
    }

    let pkTop: Array<{ characterId: string; name: string | null; level: number | null; wins: number; losses: number }> = [];
    try {
      pkTop = await prisma.$queryRawUnsafe(
        `SELECT c."id" as "characterId", c."name", c."level",
          COALESCE(NULLIF(trim(c."heroJson"->>'pvpWins'), '')::int, 0) as wins,
          COALESCE(NULLIF(trim(c."heroJson"->>'pvpLosses'), '')::int, 0) as losses
         FROM "Character" c
         WHERE COALESCE(NULLIF(trim(c."heroJson"->>'pvpWins'), '')::int, 0) > 0
            OR COALESCE(NULLIF(trim(c."heroJson"->>'pvpLosses'), '')::int, 0) > 0
         ORDER BY wins DESC, losses ASC
         LIMIT 10`
      );
    } catch {
      pkTop = [];
    }

    let arenaTotals = { fights: 0, accounts: 0 };
    try {
      const t = await prisma.$queryRawUnsafe<Array<{ fights: bigint; accounts: bigint }>>(
        `SELECT COALESCE(SUM("wins" + "losses"), 0)::bigint as fights, COUNT(*)::bigint as accounts FROM "ArenaLeaderboard"`
      );
      if (t[0]) {
        arenaTotals = { fights: Number(t[0].fights || 0), accounts: Number(t[0].accounts || 0) };
      }
    } catch {
      /* ignore */
    }

    return reply.send({ ok: true, arenaTop, pkTop, arenaTotals });
  });

  app.get("/characters/:id/pk/state", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = String((req.params as any)?.id ?? "").trim();
    if (!id) return reply.code(400).send({ error: "character id required" });

    let currentHp = null;
    let currentMp = null;
    let currentMaxHp = null;
    let currentMaxMp = null;

    const getHpMpFromSession = (idToFind: string, sess: PkSession) => {
      const isAttacker = sess.attackerId === idToFind;
      const meFighter = isAttacker ? sess.attacker : sess.defender;
      return {
        hp: meFighter.hp,
        mp: meFighter.mp,
        maxHp: meFighter.maxHp,
        maxMp: meFighter.maxMp,
      };
    };

    for (const sess of pkSessions.values()) {
      if (!sess.ended && (sess.attackerId === id || sess.defenderId === id)) {
        const stats = getHpMpFromSession(id, sess);
        currentHp = stats.hp;
        currentMp = stats.mp;
        currentMaxHp = stats.maxHp;
        currentMaxMp = stats.maxMp;
        break;
      }
    }

    if (currentHp === null) {
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ payload: unknown }>>(
          `SELECT "payload" FROM "PkSessionStore" WHERE "expiresAt" >= $1 AND ("payload"->>'attackerId' = $2 OR "payload"->>'defenderId' = $2) AND ("payload"->>'ended')::boolean = false LIMIT 1`,
          Date.now(),
          id
        );
        if (rows[0]?.payload) {
          const sessionData = typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : (rows[0].payload as any);
          if (sessionData) {
            const isAttacker = sessionData.attackerId === id;
            const meFighter = isAttacker ? sessionData.attacker : sessionData.defender;
            if (meFighter) {
              currentHp = meFighter.hp;
              currentMp = meFighter.mp;
              currentMaxHp = meFighter.maxHp;
              currentMaxMp = meFighter.maxMp;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const char = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
      select: { id: true, heroJson: true, nickColor: true },
    });
    if (!char) return reply.code(404).send({ error: "character not found" });

    let heroJson = ((char.heroJson as any) || {}) as any;

    if (currentHp !== null && currentMp !== null) {
      heroJson = {
        ...heroJson,
        hp: currentHp,
        mp: currentMp,
        maxHp: currentMaxHp ?? heroJson.maxHp,
        maxMp: currentMaxMp ?? heroJson.maxMp,
      };
    }

    const ts = Date.now();
    const pkIncoming =
      heroJson?.pkIncoming && Number(heroJson.pkIncoming?.until ?? 0) > ts ? heroJson.pkIncoming : null;
    const pkDeathNotice =
      heroJson?.pkDeathNotice && Number(heroJson.pkDeathNotice?.until ?? 0) > ts ? heroJson.pkDeathNotice : null;
    const effectiveNickColor = getEffectivePkNickColor({ ...heroJson, nickColor: char.nickColor }, ts) || null;
    const pkSyncActive = Number(heroJson?.pkSyncUntil ?? 0) > ts;

    return reply.send({
      ok: true,
      hp: Number(heroJson.hp ?? heroJson.maxHp ?? 0),
      mp: Number(heroJson.mp ?? heroJson.maxMp ?? 0),
      cp: Number(heroJson.cp ?? 0),
      maxHp: Number(heroJson.maxHp ?? 0),
      maxMp: Number(heroJson.maxMp ?? 0),
      maxCp: Number(heroJson.maxCp ?? 0),
      nickColor: effectiveNickColor,
      pkIncoming,
      pkDeathNotice,
      pkSyncActive,
    });
  });

  app.post("/characters/pk/resolve", async (req, reply) => {
    return reply.code(410).send({ error: "deprecated", message: "Use /characters/pk/session/* endpoints" });
  });
}
