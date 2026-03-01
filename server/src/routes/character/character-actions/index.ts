import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { addVersioning } from "../../../heroJsonValidator";

type PkSkill = {
  id: number;
  name?: string;
  level: number;
  mpCost: number;
  cooldownMs: number;
  powerBonus: number;
};

type PkFighter = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  pAtk: number;
  pDef: number;
  mAtk: number;
  mDef: number;
  accuracy: number;
  evasion: number;
  crit: number;
  mCrit: number;
  critPower: number;
  prefersMagic: boolean;
  skills: PkSkill[];
};

type PkSession = {
  id: string;
  attackerId: string;
  defenderId: string;
  startLocation?: string;
  attacker: PkFighter;
  defender: PkFighter;
  attackerCooldowns: Record<number, number>;
  defenderCooldowns: Record<number, number>;
  log: string[];
  ended: boolean;
  winnerId?: string;
  attackerHasHit?: boolean;
  defenderHasHit?: boolean;
  lastHitDamage?: number;
  lastHitById?: string;
  lastHitByName?: string;
  escapedById?: string;
  escapedByName?: string;
  createdAt: number;
  updatedAt: number;
  saved: boolean;
};

const PK_SESSION_TTL_MS = 10 * 60 * 1000;
const pkSessions = new Map<string, PkSession>();
let pkStoreInit: Promise<void> | null = null;

async function ensurePkStore(): Promise<void> {
  if (pkStoreInit) return pkStoreInit;
  pkStoreInit = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PkSessionStore" (
        "id" TEXT PRIMARY KEY,
        "payload" JSONB NOT NULL,
        "updatedAt" BIGINT NOT NULL,
        "expiresAt" BIGINT NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PkSessionStore_expiresAt_idx"
      ON "PkSessionStore" ("expiresAt")
    `);
  })();
  return pkStoreInit;
}

async function cleanupPkSessionsDb(now = Date.now()): Promise<void> {
  await ensurePkStore();
  await prisma.$executeRawUnsafe(`DELETE FROM "PkSessionStore" WHERE "expiresAt" < $1`, now);
}

async function savePkSessionToDb(session: PkSession): Promise<void> {
  await ensurePkStore();
  const updatedAt = session.updatedAt || Date.now();
  const expiresAt = updatedAt + PK_SESSION_TTL_MS;
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "PkSessionStore" ("id", "payload", "updatedAt", "expiresAt")
      VALUES ($1, $2::jsonb, $3, $4)
      ON CONFLICT ("id")
      DO UPDATE SET
        "payload" = EXCLUDED."payload",
        "updatedAt" = EXCLUDED."updatedAt",
        "expiresAt" = EXCLUDED."expiresAt"
    `,
    session.id,
    JSON.stringify(session),
    updatedAt,
    expiresAt
  );
}

async function loadPkSessionFromDb(sessionId: string, now = Date.now()): Promise<PkSession | undefined> {
  await ensurePkStore();
  const rows = await prisma.$queryRawUnsafe<Array<{ payload: unknown }>>(
    `SELECT "payload" FROM "PkSessionStore" WHERE "id" = $1 AND "expiresAt" >= $2 LIMIT 1`,
    sessionId,
    now
  );
  if (!rows[0]?.payload) return undefined;
  try {
    const parsed = typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : rows[0].payload;
    return parsed as PkSession;
  } catch {
    return undefined;
  }
}

function getLocation(heroJson: any): string {
  return String(heroJson?.location ?? heroJson?.currentLocation ?? heroJson?.zone ?? "").trim();
}

function isOnline(lastActivityAt: Date | null | undefined, updatedAt?: Date | null): boolean {
  const effective = lastActivityAt ?? updatedAt ?? null;
  if (!effective) return false;
  return new Date(effective).getTime() >= Date.now() - 10 * 60 * 1000;
}

function normalizeSkills(heroJson: any): PkSkill[] {
  const raw = Array.isArray(heroJson?.skills) ? heroJson.skills : [];
  const bestById = new Map<number, number>();
  for (const s of raw) {
    const id = Number((s as any)?.id);
    const level = Math.max(1, Number((s as any)?.level) || 1);
    if (!id) continue;
    const prev = bestById.get(id) || 0;
    if (level > prev) bestById.set(id, level);
  }
  return Array.from(bestById.entries()).map(([id, level]) => ({
    id,
    level,
    mpCost: Math.max(0, 6 + level * 2),
    cooldownMs: Math.max(1000, (2 + Math.floor(level / 5)) * 1000),
    powerBonus: 10 + level * 8,
  }));
}

function buildPkFighter(character: {
  id: string;
  name: string;
  level: number;
  heroJson: unknown;
}): PkFighter {
  const heroJson = (character.heroJson as any) || {};
  const level = Math.max(1, Number(character.level || 1));
  const battleStats = heroJson?.battleStats || {};

  const maxHp = Math.max(1, Number(heroJson?.maxHp ?? 180 + level * 24) || 1);
  const maxMp = Math.max(1, Number(heroJson?.maxMp ?? 100 + level * 10) || 1);
  const hp = Math.max(1, Math.min(maxHp, Number(heroJson?.hp ?? maxHp) || maxHp));
  const mp = Math.max(0, Math.min(maxMp, Number(heroJson?.mp ?? maxMp) || maxMp));

  const pAtk = Math.max(10, Number(battleStats?.pAtk ?? 40 + level * 6) || 10);
  const pDef = Math.max(5, Number(battleStats?.pDef ?? 25 + level * 4) || 5);
  const mAtk = Math.max(10, Number(battleStats?.mAtk ?? 35 + level * 5) || 10);
  const mDef = Math.max(5, Number(battleStats?.mDef ?? 20 + level * 4) || 5);

  const accuracy = Number(battleStats?.accuracy || 0);
  const evasion = Number(battleStats?.evasion || 0);
  const crit = Number(battleStats?.crit || 40);
  const mCrit = Number(battleStats?.mCrit || 4);
  const critPower = Number(battleStats?.critPower ?? battleStats?.critDamage ?? 100);

  const prefersMagic = mAtk > pAtk * 1.15;
  const skills = normalizeSkills(heroJson);

  return {
    id: character.id,
    name: character.name,
    hp,
    maxHp,
    mp,
    maxMp,
    pAtk,
    pDef,
    mAtk,
    mDef,
    accuracy,
    evasion,
    crit,
    mCrit,
    critPower,
    prefersMagic,
    skills,
  };
}

async function cleanupPkSessions(now = Date.now()) {
  for (const [id, s] of pkSessions.entries()) {
    if (now - s.updatedAt > PK_SESSION_TTL_MS) pkSessions.delete(id);
  }
  await cleanupPkSessionsDb(now);
}

/** Оновлює maxHp/maxMp у сесії з поточного heroJson в БД, щоб HP було однакове всюди */
async function refreshPkFighterStatsFromDb(session: PkSession): Promise<void> {
  const chars = await prisma.character.findMany({
    where: { id: { in: [session.attackerId, session.defenderId] } },
    select: { id: true, heroJson: true, level: true },
  });
  const attackerChar = chars.find((c) => c.id === session.attackerId);
  const defenderChar = chars.find((c) => c.id === session.defenderId);
  if (attackerChar?.heroJson) {
    const heroJson = (attackerChar.heroJson as any) || {};
    const level = Math.max(1, Number(attackerChar.level || 1));
    const maxHp = Math.max(1, Number(heroJson?.maxHp ?? 180 + level * 24) || 1);
    const maxMp = Math.max(1, Number(heroJson?.maxMp ?? 100 + level * 10) || 1);
    session.attacker.maxHp = maxHp;
    session.attacker.maxMp = maxMp;
    session.attacker.hp = Math.min(session.attacker.hp, maxHp);
    session.attacker.mp = Math.min(session.attacker.mp, maxMp);
  }
  if (defenderChar?.heroJson) {
    const heroJson = (defenderChar.heroJson as any) || {};
    const level = Math.max(1, Number(defenderChar.level || 1));
    const maxHp = Math.max(1, Number(heroJson?.maxHp ?? 180 + level * 24) || 1);
    const maxMp = Math.max(1, Number(heroJson?.maxMp ?? 100 + level * 10) || 1);
    session.defender.maxHp = maxHp;
    session.defender.maxMp = maxMp;
    session.defender.hp = Math.min(session.defender.hp, maxHp);
    session.defender.mp = Math.min(session.defender.mp, maxMp);
  }
}

function serializePkSession(session: PkSession) {
  return {
    ok: true,
    serverNow: Date.now(),
    session: {
      id: session.id,
      attackerId: session.attackerId,
      defenderId: session.defenderId,
      attacker: session.attacker,
      defender: session.defender,
      cooldowns: session.attackerCooldowns,
      attackerCooldowns: session.attackerCooldowns,
      defenderCooldowns: session.defenderCooldowns ?? {},
      log: session.log,
      ended: session.ended,
      winnerId: session.winnerId ?? null,
      escapedById: session.escapedById ?? null,
      escapedByName: session.escapedByName ?? null,
      updatedAt: session.updatedAt,
    },
  };
}

/** Урон як у клієнті: простий удар = pAtk - pDef, скіл = трохи більше (+ powerBonus). */
function computeDamage(attacker: PkFighter, defender: PkFighter, powerBonus: number, useMagic: boolean): { dmg: number; isCrit: boolean; isMiss: boolean } {
  const pAtk = Math.max(1, Number(attacker.pAtk || 1));
  const mAtk = Math.max(1, Number(attacker.mAtk || 1));
  const pDef = Math.max(1, Number(defender.pDef || 1));
  const mDef = Math.max(1, Number(defender.mDef || 1));
  const skillBonus = Math.max(0, Number(powerBonus || 0));

  // Перевірка на промах (тільки для фізичних атак, скіли не промахуються)
  if (!useMagic && powerBonus === 0) {
    const hitChance = Math.max(20, Math.min(100, 90 + (attacker.accuracy || 0) - (defender.evasion || 0)));
    if (Math.random() * 100 > hitChance) {
      return { dmg: 0, isCrit: false, isMiss: true };
    }
  }

  const critChanceRaw = useMagic ? (attacker.mCrit || 4) : (attacker.crit || 40);
  const critChance = Math.min(80, critChanceRaw);
  const isCrit = Math.random() * 100 < critChance;
  
  const critPower = attacker.critPower || 100;
  // Для скілів максимальний множник вищий (3.0), для простих атак (2.0)
  const critMult = isCrit ? (powerBonus > 0 ? Math.min(3.0, 2.0 + critPower / 1500) : Math.min(2.0, 1.5 + critPower / 5000)) : 1.0;

  const variance = 0.92 + Math.random() * 0.16; // 0.92 - 1.08

  if (useMagic) {
    const raw = Math.max(0, mAtk - mDef);
    const base = raw + skillBonus;
    return { dmg: Math.max(1, Math.floor(base * variance * critMult)), isCrit, isMiss: false };
  }
  const raw = Math.max(0, pAtk - pDef);
  const base = raw + skillBonus;
  return { dmg: Math.max(1, Math.floor(base * variance * critMult)), isCrit, isMiss: false };
}

function getEffectivePkNickColor(heroJson: any, now = Date.now()): string | undefined {
  const forcedColor = String(heroJson?.pkForcedNickColor ?? "").trim();
  const forcedUntilRaw = heroJson?.pkForcedNickColorUntil;
  const forcedUntil = Number(forcedUntilRaw);
  if (forcedColor) {
    if (!Number.isFinite(forcedUntil) || forcedUntil > now) return forcedColor;
  }
  const combatColor = String(heroJson?.pkCombatNickColor ?? "").trim();
  const combatUntil = Number(heroJson?.pkCombatNickColorUntil);
  if (combatColor && Number.isFinite(combatUntil) && combatUntil > now) return combatColor;
  const baseColor = String(heroJson?.nickColor ?? "").trim();
  return baseColor || undefined;
}

async function syncPkRealtimeState(session: PkSession, actorRole: "attacker" | "defender", now = Date.now()) {
  const actorId = actorRole === "attacker" ? session.attackerId : session.defenderId;
  const targetId = actorRole === "attacker" ? session.defenderId : session.attackerId;
  const actorState = actorRole === "attacker" ? session.attacker : session.defender;
  const targetState = actorRole === "attacker" ? session.defender : session.attacker;

  await prisma.$transaction(async (tx) => {
    const ids = [actorId, targetId].sort();
    await tx.$queryRawUnsafe(
      `SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`,
      ids[0],
      ids[1]
    );
    const chars = await tx.character.findMany({
      where: { id: { in: [actorId, targetId] } },
      select: { id: true, heroJson: true },
    });
    if (chars.length !== 2) return;

    const actorChar = chars.find((c) => c.id === actorId);
    const targetChar = chars.find((c) => c.id === targetId);
    if (!actorChar || !targetChar) return;

    const actorJson = ((actorChar.heroJson as any) || {}) as any;
    const targetJson = ((targetChar.heroJson as any) || {}) as any;

    const combatColor = "#FC0FC0";
    const combatUntil = now + 10_000;
    const pkSyncUntil = now + 15_000;
    const actorDisplayColor = getEffectivePkNickColor({ ...actorJson, pkCombatNickColor: combatColor, pkCombatNickColorUntil: combatUntil }, now) || combatColor;

    const nextActorJson = addVersioning(
      {
        ...actorJson,
        hp: actorState.hp,
        mp: actorState.mp,
        maxHp: actorState.maxHp,
        maxMp: actorState.maxMp,
        pkCombatNickColor: combatColor,
        pkCombatNickColorUntil: combatUntil,
        pkSyncUntil,
      },
      Number(actorJson.heroRevision ?? 0) || 0
    );
    const nextTargetJson = addVersioning(
      {
        ...targetJson,
        hp: targetState.hp,
        mp: targetState.mp,
        maxHp: targetState.maxHp,
        maxMp: targetState.maxMp,
        pkIncoming: {
          attackerId: actorId,
          attackerName: actorState.name,
          attackerNickColor: actorDisplayColor,
          sessionId: session.id,
          until: now + 10_000,
        },
        pkSyncUntil,
      },
      Number(targetJson.heroRevision ?? 0) || 0
    );

    await tx.character.update({
      where: { id: actorId },
      data: { heroJson: nextActorJson, lastActivityAt: new Date() },
    });
    await tx.character.update({
      where: { id: targetId },
      data: { heroJson: nextTargetJson, lastActivityAt: new Date() },
    });
  });
}

async function savePkResultIfNeeded(session: PkSession) {
  if (!session.ended || !session.winnerId || session.saved) return;
  const loserId = session.winnerId === session.attackerId ? session.defenderId : session.attackerId;

  await prisma.$transaction(async (tx) => {
    const ids = [session.winnerId as string, loserId].sort();
    await tx.$queryRawUnsafe(
      `SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`,
      ids[0],
      ids[1]
    );

    const chars = await tx.character.findMany({
      where: { id: { in: [session.winnerId as string, loserId] } },
      select: { id: true, heroJson: true },
    });
    if (chars.length !== 2) return;

    const patchPvp = (heroJson: any, isWin: boolean) => {
      const wins = Number(heroJson?.pvpWins ?? heroJson?.pvp_wins ?? 0);
      const losses = Number(heroJson?.pvpLosses ?? heroJson?.pvp_losses ?? 0);
      const nextWins = isWin ? wins + 1 : wins;
      const nextLosses = isWin ? losses : losses + 1;
      return {
        ...heroJson,
        pvpWins: nextWins,
        pvpLosses: nextLosses,
        pvp_wins: nextWins,
        pvp_losses: nextLosses,
      };
    };

    const winnerChar = chars.find((c) => c.id === session.winnerId);
    const winnerHeroJson = ((winnerChar?.heroJson as any) || {}) as any;
    const winnerNickColor = getEffectivePkNickColor(winnerHeroJson) || String(winnerHeroJson?.nickColor ?? "").trim() || undefined;
    const deathLog = Array.isArray(session.log) ? session.log.slice(0, 12) : [];

    for (const c of chars) {
      const heroJson = ((c.heroJson as any) || {}) as any;
      const patched = patchPvp(heroJson, c.id === session.winnerId);
      const isWinner = c.id === session.winnerId;
      const winnerIsAttacker = session.winnerId === session.attackerId;
      const winnerHitBack = winnerIsAttacker ? Boolean(session.defenderHasHit) : Boolean(session.attackerHasHit);
      const now = Date.now();
      const withPkColor = isWinner
        ? (
          !winnerHitBack
            ? {
                ...patched,
                pkForcedNickColor: "#800000",
                pkForcedNickColorUntil: now + 10 * 60 * 1000,
                pkIncoming: null,
                pkSyncUntil: 0,
              }
            : {
                ...patched,
                pkIncoming: null,
                pkSyncUntil: 0,
              }
        )
        : {
            ...patched,
            // Після PK смерті не залишаємо персонажа "мертвим" — даємо піднятися одразу.
            hp: Math.max(1, Number((session.winnerId === session.attackerId ? session.defender.maxHp : session.attacker.maxHp) || heroJson.maxHp || 1)),
            mp: Math.max(0, Number((session.winnerId === session.attackerId ? session.defender.maxMp : session.attacker.maxMp) || heroJson.maxMp || 0)),
            cp: Math.max(0, Number(heroJson.maxCp ?? heroJson.cp ?? 0)),
            isDead: false,
            deadAt: 0,
            pkIncoming: null,
            pkSyncUntil: 0,
            pkDeathNotice: {
              killerId: session.winnerId,
              killerName: winnerChar?.id === session.attackerId ? session.attacker.name : session.defender.name,
              killerNickColor: winnerNickColor || null,
              lastDamage: Number(session.lastHitDamage ?? 0),
              log: deathLog,
              at: now,
              until: now + 20_000,
            },
          };
      const versioned = addVersioning(withPkColor, Number(heroJson.heroRevision ?? 0) || 0);
      await tx.character.update({
        where: { id: c.id },
        data: { heroJson: versioned, lastActivityAt: new Date() },
      });
    }
  });

  session.saved = true;
}

export async function characterActionsRoutes(app: FastifyInstance) {
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
      // Fallback для БД, де ще немає колонки lastActivityAt.
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

  // POST /characters/pk/session/:id/sync-stats
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
    const body = (req.body ?? {}) as { hp?: number; maxHp?: number; mp?: number; maxMp?: number };
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
    session.updatedAt = Date.now();
    await savePkSessionToDb(session);
    
    // Оновлюємо також HP в базі даних героя (heroJson), щоб після оновлення сторінки HP не падало
    let heroJson = ((me.heroJson as any) || {}) as any;
    heroJson = addVersioning(
      {
        ...heroJson,
        hp: fighter.hp,
        mp: fighter.mp,
        maxHp: fighter.maxHp,
        maxMp: fighter.maxMp,
      },
      Number(heroJson.heroRevision ?? 0) || 0
    );
    await prisma.character.update({
      where: { id: me.id },
      data: { heroJson }
    });
    
    // Якщо противник - бот, ми його не оновлюємо, але якщо він живий, то можемо оновити його ХП у кеші
    if (session.defenderId !== me.id) {
       // Це атакуючий синхронізує статс
       session.attacker.hp = fighter.hp;
       session.attacker.mp = fighter.mp;
       session.attacker.maxHp = fighter.maxHp;
       session.attacker.maxMp = fighter.maxMp;
    } else {
       // Це захисник синхронізує статс
       session.defender.hp = fighter.hp;
       session.defender.mp = fighter.mp;
       session.defender.maxHp = fighter.maxHp;
       session.defender.maxMp = fighter.maxMp;
    }

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

    await refreshPkFighterStatsFromDb(session);
    return reply.send(serializePkSession(session));
  });

  app.post("/characters/pk/session/:id/act", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();

    const sessionId = String((req.params as any)?.id ?? "").trim();
    const body = (req.body ?? {}) as { skillId?: number };
    const skillId = body.skillId !== undefined ? Number(body.skillId) : undefined;

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

    // Якщо хтось вийшов з окресності/офлайн — завершуємо PK як "втеча" без PvP win/loss.
    const charsLive = await prisma.character.findMany({
      where: { id: { in: [session.attackerId, session.defenderId] } },
      select: { id: true, name: true, heroJson: true, lastActivityAt: true, updatedAt: true },
    });
    const liveAttacker = charsLive.find((c) => c.id === session.attackerId);
    const liveDefender = charsLive.find((c) => c.id === session.defenderId);
    const baseLoc = String(session.startLocation ?? "").trim() || getLocation(liveAttacker?.heroJson as any) || getLocation(liveDefender?.heroJson as any);
    session.startLocation = baseLoc || session.startLocation;
    const attackerLocNow = getLocation(liveAttacker?.heroJson as any);
    const defenderLocNow = getLocation(liveDefender?.heroJson as any);
    const attackerOnline = isOnline(liveAttacker?.lastActivityAt as any, liveAttacker?.updatedAt as any);
    const defenderOnline = isOnline(liveDefender?.lastActivityAt as any, liveDefender?.updatedAt as any);
    const attackerEscaped = !!baseLoc && attackerLocNow !== baseLoc;
    const defenderEscaped = !!baseLoc && defenderLocNow !== baseLoc;
    const someoneEscaped = !attackerOnline || !defenderOnline || attackerEscaped || defenderEscaped;
    if (someoneEscaped) {
      const escapedChar =
        (!defenderOnline || defenderEscaped)
          ? liveDefender
          : liveAttacker;
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
        await tx.$queryRawUnsafe(
          `SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`,
          ids[0],
          ids[1]
        );
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
      if (requestedSkillId !== undefined) {
        const requested = fighter.skills.find((s) => s.id === requestedSkillId);
        if (!requested) return null;
        if ((cooldowns[requested.id] ?? 0) > now) return null;
        if (fighter.mp < requested.mpCost) return null;
        return requested;
      }
      const usable = fighter.skills.filter((s) => {
        return (cooldowns[s.id] ?? 0) <= now && fighter.mp >= s.mpCost;
      });
      if (usable.length === 0) return null;
      return usable[Math.floor(Math.random() * usable.length)];
    };

    const doTurn = (
      attacker: PkFighter,
      defender: PkFighter,
      cooldowns: Record<number, number>,
      requestedSkillId?: number
    ): number => {
      const skill = pickSkill(attacker, cooldowns, requestedSkillId);
      const useMagic = skill ? attacker.prefersMagic : false;
      const powerBonus = skill?.powerBonus ?? 0;
      const { dmg, isCrit, isMiss } = computeDamage(attacker, defender, powerBonus, useMagic);
      defender.hp = Math.max(0, defender.hp - dmg);
      
      const critText = isCrit ? " (критический удар!)" : "";

      if (isMiss) {
        session.log.unshift(`${attacker.name} промахивается по ${defender.name}!`);
      } else if (skill) {
        attacker.mp = Math.max(0, attacker.mp - skill.mpCost);
        cooldowns[skill.id] = now + skill.cooldownMs;
        session.log.unshift(`${attacker.name} использует ${skill.name || `skill#${skill.id}`} и наносит ${dmg} урона${critText}`);
      } else {
        session.log.unshift(`${attacker.name} атакует (простая атака) и наносит ${dmg} урона${critText}`);
      }
      session.log = session.log.slice(0, 30);
      return dmg;
    };

    if (session.attackerHasHit === undefined) session.attackerHasHit = false;
    if (session.defenderHasHit === undefined) session.defenderHasHit = false;
    if (actorRole === "attacker") {
      const dmg = doTurn(session.attacker, session.defender, session.attackerCooldowns, skillId);
      session.lastHitDamage = dmg;
      session.lastHitById = session.attackerId;
      session.lastHitByName = session.attacker.name;
      session.attackerHasHit = true;
      
      // Оновлюємо ХП в базі даних захисника, щоб після F5 воно не відновилось
      const defenderChar = await prisma.character.findUnique({ where: { id: session.defenderId }, select: { heroJson: true }});
      if (defenderChar) {
         let defHeroJson = ((defenderChar.heroJson as any) || {}) as any;
         defHeroJson = addVersioning({ ...defHeroJson, hp: session.defender.hp, mp: session.defender.mp, maxHp: session.defender.maxHp, maxMp: session.defender.maxMp }, Number(defHeroJson.heroRevision ?? 0) || 0);
         await prisma.character.update({ where: { id: session.defenderId }, data: { heroJson: defHeroJson }});
      }
      
      if (session.defender.hp <= 0) {
        session.ended = true;
        session.winnerId = session.attackerId;
      }
    } else {
      const dmg = doTurn(session.defender, session.attacker, session.defenderCooldowns, skillId);
      session.lastHitDamage = dmg;
      session.lastHitById = session.defenderId;
      session.lastHitByName = session.defender.name;
      session.defenderHasHit = true;
      
      // Оновлюємо ХП в базі даних атакуючого, щоб після F5 воно не відновилось
      const attackerChar = await prisma.character.findUnique({ where: { id: session.attackerId }, select: { heroJson: true }});
      if (attackerChar) {
         let attHeroJson = ((attackerChar.heroJson as any) || {}) as any;
         attHeroJson = addVersioning({ ...attHeroJson, hp: session.attacker.hp, mp: session.attacker.mp, maxHp: session.attacker.maxHp, maxMp: session.attacker.maxMp }, Number(attHeroJson.heroRevision ?? 0) || 0);
         await prisma.character.update({ where: { id: session.attackerId }, data: { heroJson: attHeroJson }});
      }

      if (session.attacker.hp <= 0) {
        session.ended = true;
        session.winnerId = session.defenderId;
      }
    }
    session.updatedAt = Date.now();

    await syncPkRealtimeState(session, actorRole, now);
    await savePkResultIfNeeded(session);
    await savePkSessionToDb(session);
    await refreshPkFighterStatsFromDb(session);
    return reply.send(serializePkSession(session));
  });

  app.get("/characters/:id/pk/state", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = String((req.params as any)?.id ?? "").trim();
    if (!id) return reply.code(400).send({ error: "character id required" });

    // Під час запиту стану PK ми повинні також оновити heroJson, якщо є активна сесія PK.
    // Це потрібно для того, щоб якщо хп змінюється в сесії, воно також змінювалось в БД і клієнт бачив актуальне хп.
    let currentHp = null;
    let currentMp = null;
    let currentMaxHp = null;
    let currentMaxMp = null;
    
    const getHpMpFromSession = (idToFind: string, session: typeof pkSessions extends Map<any, infer V> ? V : any) => {
       const isAttacker = session.attackerId === idToFind;
       const meFighter = isAttacker ? session.attacker : session.defender;
       return {
         hp: meFighter.hp,
         mp: meFighter.mp,
         maxHp: meFighter.maxHp,
         maxMp: meFighter.maxMp
       };
    };

    // Спробуємо знайти активну сесію де ми беремо участь
    for (const session of pkSessions.values()) {
      if (!session.ended && (session.attackerId === id || session.defenderId === id)) {
        const stats = getHpMpFromSession(id, session);
        currentHp = stats.hp;
        currentMp = stats.mp;
        currentMaxHp = stats.maxHp;
        currentMaxMp = stats.maxMp;
        break;
      }
    }
    
    // Якщо в пам'яті немає, спробуємо знайти в БД
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
       } catch (err) {
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
      heroJson = addVersioning(
        {
          ...heroJson,
          hp: currentHp,
          mp: currentMp,
          maxHp: currentMaxHp ?? heroJson.maxHp,
          maxMp: currentMaxMp ?? heroJson.maxMp,
        },
        Number(heroJson.heroRevision ?? 0) || 0
      );
      // Оновлюємо в базі, щоб інші клієнти теж бачили
      await prisma.character.update({
        where: { id },
        data: { heroJson }
      });
    }

    const now = Date.now();
    const pkIncoming = heroJson?.pkIncoming && Number(heroJson.pkIncoming?.until ?? 0) > now
      ? heroJson.pkIncoming
      : null;
    const pkDeathNotice = heroJson?.pkDeathNotice && Number(heroJson.pkDeathNotice?.until ?? 0) > now
      ? heroJson.pkDeathNotice
      : null;
    const effectiveNickColor = getEffectivePkNickColor({ ...heroJson, nickColor: char.nickColor }, now) || null;
    const pkSyncActive = Number(heroJson?.pkSyncUntil ?? 0) > now;

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

  // POST /characters/:id/colorize-nick - зміна кольору ніка (50 Coin of Luck)
  app.post("/characters/:id/colorize-nick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { nickColor?: string; expectedRevision?: number };

    if (!body.nickColor || typeof body.nickColor !== "string") {
      return reply.code(400).send({ error: "nickColor required" });
    }
    const nickColor = body.nickColor.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(nickColor)) {
      return reply.code(400).send({ error: "invalid nickColor (expected #RRGGBB)" });
    }

    const PRICE = 50;

    try {
      const ch = await prisma.character.findFirst({
        where: { id: targetId, accountId: auth.accountId },
        select: { id: true, coinLuck: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const oldRevision = heroJson.heroRevision ?? 0;
      if (body.expectedRevision !== undefined && body.expectedRevision !== oldRevision) {
        return reply.code(409).send({ error: "revision_conflict", revision: oldRevision });
      }

      const currentCoinLuck = ch.coinLuck ?? 0;
      if (currentCoinLuck < PRICE) {
        return reply.code(400).send({ error: "not enough coinLuck", coinLuck: currentCoinLuck });
      }

      const updatedHeroJson = addVersioning(
        { ...heroJson, nickColor },
        oldRevision
      );

      const updated = await prisma.character.update({
        where: { id: ch.id },
        data: {
          coinLuck: { decrement: PRICE },
          nickColor,
          heroJson: updatedHeroJson,
        },
        select: { id: true, coinLuck: true, nickColor: true, heroJson: true, name: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
      });

      return reply.send({ ok: true, character: { ...updated, exp: Number(updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error colorize-nick:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/rename-nick - зміна ніка (50 Coin of Luck)
  app.post("/characters/:id/rename-nick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { name?: string; expectedRevision?: number };

    const newName = (body.name ?? "").trim();
    if (newName.length < 2) return reply.code(400).send({ error: "name too short" });
    if (!/^[A-Za-z0-9_\- ]+$/.test(newName)) {
      return reply.code(400).send({ error: "invalid name (use only A-Z, a-z, 0-9, _, -, space)" });
    }

    const PRICE = 50;

    try {
      const ch = await prisma.character.findFirst({
        where: { id: targetId, accountId: auth.accountId },
        select: { id: true, coinLuck: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const oldRevision = heroJson.heroRevision ?? 0;
      if (body.expectedRevision !== undefined && body.expectedRevision !== oldRevision) {
        return reply.code(409).send({ error: "revision_conflict", revision: oldRevision });
      }

      const currentCoinLuck = Number(ch.coinLuck ?? 0);
      if (currentCoinLuck < PRICE) {
        return reply.code(400).send({ error: "not enough coinLuck", coinLuck: currentCoinLuck });
      }

      const updatedHeroJson = addVersioning(
        { ...heroJson, name: newName, coinOfLuck: currentCoinLuck - PRICE },
        oldRevision
      );

      const updated = await prisma.character.update({
        where: { id: ch.id },
        data: {
          coinLuck: { decrement: PRICE },
          name: newName,
          heroJson: updatedHeroJson,
        },
        select: { id: true, coinLuck: true, name: true, heroJson: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
      });

      return reply.send({ ok: true, character: { ...updated, exp: Number(updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error rename-nick:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/heal - лікування іншого гравця
  app.post("/characters/:id/heal", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { skillId: number; power: number };

    if (!body.skillId || !body.power) {
      return reply.code(400).send({ error: "skillId and power are required" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${targetId} FOR UPDATE`;

        const targetChar = await tx.character.findUnique({
          where: { id: targetId },
          select: { id: true, level: true, heroJson: true },
        });
        if (!targetChar) throw new Error("target character not found");

        const heroJson = (targetChar.heroJson as any) || {};
        const rawMaxHp = Number(
          heroJson.maxHp ?? heroJson.maxHP ?? heroJson.max_hp ??
          heroJson?.resources?.maxHp ?? heroJson?.battleStats?.maxHp ?? 0
        );
        const level = Number(targetChar.level ?? 1);
        const maxHp = rawMaxHp > 100 ? rawMaxHp : Math.max(100, 150 + level * 12);
        const rawHp = Number(heroJson.hp ?? 0);
        const currentHp = rawHp > 0 ? Math.min(rawHp, maxHp) : maxHp;
        const newHp = Math.min(maxHp, currentHp + body.power);

        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        const updatedHeroJson = addVersioning(
          { ...heroJson, hp: newHp, maxHp },
          oldRevision
        );

        await tx.character.update({
          where: { id: targetId },
          data: { heroJson: updatedHeroJson },
        });

        return { healedHp: newHp - currentHp, currentHp: newHp };
      });

      return { ok: true, healedHp: result.healedHp, currentHp: result.currentHp };
    } catch (error) {
      if (error instanceof Error && error.message === "target character not found") {
        return reply.code(404).send({ error: "target character not found" });
      }
      app.log.error(error, "Error healing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/buff - застосування бафу до іншого гравця
  app.post("/characters/:id/buff", async (req, reply) => {
    app.log.info(`[POST /characters/:id/buff] Request received: ${req.url}`);
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { skillId: number; buffData: any };
    
    app.log.info(`[POST /characters/:id/buff] targetId: ${targetId}, skillId: ${body?.skillId}`);

    if (!body.skillId || !body.buffData) {
      return reply.code(400).send({ error: "skillId and buffData are required" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${targetId} FOR UPDATE`;

        const targetChar = await tx.character.findUnique({
          where: { id: targetId },
          select: { id: true, heroJson: true },
        });
        if (!targetChar) throw new Error("target character not found");

        const heroJson = (targetChar.heroJson as any) || {};
        const currentBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];

        const newBuff = {
          id: body.skillId,
          name: body.buffData.name || "",
          icon: body.buffData.icon || "",
          effects: body.buffData.effects || [],
          expiresAt: body.buffData.expiresAt || (Date.now() + (body.buffData.duration || 0) * 1000),
          startedAt: Date.now(),
          durationMs: (body.buffData.duration || 0) * 1000,
          source: "skill" as const,
          buffGroup: body.buffData.buffGroup,
          stackType: body.buffData.stackType,
        };

        let filteredBuffs = currentBuffs.filter((b: any) => {
          if (b.id === body.skillId) return false;
          if (newBuff.buffGroup && b.buffGroup === newBuff.buffGroup) {
            return false;
          }
          return true;
        });

        const existingBuff = currentBuffs.find((b: any) => b.id === body.skillId);
        if (existingBuff) {
          const newTotalPower = (newBuff.effects || []).reduce((sum: number, eff: any) => {
            if (eff.mode === "multiplier") {
              return sum + (eff.multiplier || 1);
            } else if (eff.mode === "percent") {
              return sum + Math.abs(eff.value || 0);
            } else {
              return sum + Math.abs(eff.value || 0);
            }
          }, 0);

          const oldTotalPower = (existingBuff.effects || []).reduce((sum: number, eff: any) => {
            if (eff.mode === "multiplier") {
              return sum + (eff.multiplier || 1);
            } else if (eff.mode === "percent") {
              return sum + Math.abs(eff.value || 0);
            } else {
              return sum + Math.abs(eff.value || 0);
            }
          }, 0);

          if (oldTotalPower >= newTotalPower) {
            app.log.info(
              {
                targetId,
                skillId: body.skillId,
                reason: "existing_buff_better",
                oldPower: oldTotalPower,
                newPower: newTotalPower,
              },
              '[POST /characters/:id/buff] Keeping existing buff (better than new)'
            );
            return { skipped: true };
          }

          app.log.info(
            {
              targetId,
              skillId: body.skillId,
              reason: "replacing_with_better",
              oldPower: oldTotalPower,
              newPower: newTotalPower,
            },
            '[POST /characters/:id/buff] Replacing buff with better version'
          );
        }

        const updatedBuffs = [...filteredBuffs, newBuff];
        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        const updatedHeroJson = addVersioning(
          { ...heroJson, heroBuffs: updatedBuffs },
          oldRevision
        );

        await tx.character.update({
          where: { id: targetId },
          data: { heroJson: updatedHeroJson },
        });

        return { skipped: false, updatedBuffs, newBuff };
      });

      if (result.skipped) {
        return reply.code(200).send({ ok: true, message: "Existing buff is better, keeping it" });
      }

      const updatedBuffs = result.updatedBuffs ?? [];
      const skillId = body.skillId;
      const buffName = result.newBuff?.name || "";
      const totalBuffs = updatedBuffs.length;
      app.log.info(
        {
          targetId,
          skillId,
          buffName,
          totalBuffs,
          buffs: updatedBuffs.map((b: any) => ({
            id: b.id,
            name: b.name,
            expiresAt: b.expiresAt,
          })),
        },
        '[POST /characters/:id/buff] Buff applied'
      );

      return { ok: true, message: "Buff applied successfully" };
    } catch (error) {
      if (error instanceof Error && error.message === "target character not found") {
        return reply.code(404).send({ error: "target character not found" });
      }
      app.log.error(error, "Error buffing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/resurrect — атомарно скидає смерть, ставить ресурси на max
  app.post("/characters/:id/resurrect", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    if (!targetId) return reply.code(400).send({ error: "character id required" });

    try {
      const ch = await prisma.character.findFirst({
        where: { id: targetId, accountId: auth.accountId },
        select: { id: true, name: true, race: true, classId: true, sex: true, level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true, coinsSilver: true, heroJson: true, updatedAt: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const maxHp = Math.max(1, Number(heroJson.maxHp) || 100);
      const maxMp = Math.max(1, Number(heroJson.maxMp) || 50);
      const maxCp = Math.max(1, Number(heroJson.maxCp) || Math.round(maxHp * 0.6));

      const patchedHeroJson = {
        ...heroJson,
        isDead: false,
        deadAt: 0,
        hp: maxHp,
        mp: maxMp,
        cp: maxCp,
        hpFull: true,
        mpFull: true,
        cpFull: true,
        hpPercent: 1,
        mpPercent: 1,
        cpPercent: 1,
        heroBuffs: [],
      };

      const oldRevision = heroJson.heroRevision || 0;
      const versionedHeroJson = addVersioning(patchedHeroJson, oldRevision);

      const updated = await prisma.character.update({
        where: { id: ch.id },
        data: { heroJson: versionedHeroJson, lastActivityAt: new Date() },
        select: { id: true, name: true, race: true, classId: true, sex: true, level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true, coinsSilver: true, heroJson: true, updatedAt: true },
      });

      return reply.send({ ok: true, character: { ...updated, exp: Number(updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error resurrect character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const VIEW_STATS_COST = 1_000_000;

  // POST /characters/:targetId/pay-view-stats - сплатити 1M аден для перегляду характеристик іншого гравця
  app.post("/characters/:targetId/pay-view-stats", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const targetId = (req.params as { targetId?: string }).targetId;
    if (!targetId) return reply.code(400).send({ error: "targetId required" });

    try {
      const myChar = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true, adena: true },
      });
      if (!myChar) return reply.code(404).send({ error: "character not found" });
      const currentAdena = Number(myChar.adena ?? 0);
      if (currentAdena < VIEW_STATS_COST) {
        return reply.code(400).send({ error: "not enough adena", needed: VIEW_STATS_COST, have: currentAdena });
      }
      await prisma.character.update({
        where: { id: myChar.id },
        data: { adena: { decrement: VIEW_STATS_COST } },
      });
      return reply.send({ ok: true, newAdena: currentAdena - VIEW_STATS_COST });
    } catch (error) {
      app.log.error(error, "POST /characters/:targetId/pay-view-stats");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });
}