import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { addVersioning, validateHeroJson } from "../../../../heroJsonValidator";
import type { PkSession } from "../pk/types";
import { buildPkFighter } from "../pk/helpers";
import { pkSessions, savePkSessionToDb } from "../pk/store";
import {
  TVT_DAILY_SLOTS,
  TVT_MATCH_MAX_MS,
  TVT_PICK_AFK_MS,
  dayKeyFromDate,
  isBattleStartWindow,
} from "./schedule";
import { persistTvtState } from "./persistence";
import { tvtMatches, tvtRegistrations, tvtStartedSlots, regKey } from "./store";
import type { TvtMatchState } from "./types";

const TVT_TVT_COINS = 2;
const TVT_INV_ITEM = "coin_of_luck";
const TVT_INV_QTY = 2;

const INV_MIN = 100;
const INV_MAX = 500;

function inventoryCap(hj: any): number {
  const cap = hj?.inventoryCapacity;
  if (typeof cap !== "number" || cap < INV_MIN) return INV_MIN;
  return Math.min(cap, INV_MAX);
}

function splitTeamIds(participantIds: string[]): { teamA: string[]; teamB: string[] } | null {
  const n = participantIds.length;
  if (n < 2) return null;
  if (n === 2) return { teamA: [participantIds[0]], teamB: [participantIds[1]] };
  if (n === 4) return { teamA: [participantIds[0], participantIds[1]], teamB: [participantIds[2], participantIds[3]] };
  if (n === 5) return { teamA: [participantIds[0], participantIds[1]], teamB: [participantIds[2], participantIds[3], participantIds[4]] };
  const half = Math.ceil(n / 2);
  return { teamA: participantIds.slice(0, half), teamB: participantIds.slice(half) };
}

async function createTvtPkSession(attackerId: string, defenderId: string, tvtMatchId: string, logLine: string): Promise<PkSession> {
  let chars: Array<{
    id: string;
    name: string;
    level: number;
    heroJson: unknown;
    lastActivityAt?: Date | null;
    updatedAt?: Date | null;
  }> = [];
  try {
    chars = await prisma.character.findMany({
      where: { id: { in: [attackerId, defenderId] } },
      select: { id: true, name: true, level: true, heroJson: true, lastActivityAt: true, updatedAt: true },
    });
  } catch {
    chars = await prisma.character.findMany({
      where: { id: { in: [attackerId, defenderId] } },
      select: { id: true, name: true, level: true, heroJson: true, updatedAt: true },
    });
  }
  const attackerChar = chars.find((c) => c.id === attackerId);
  const defenderChar = chars.find((c) => c.id === defenderId);
  if (!attackerChar || !defenderChar) throw new Error("tvt: character not found");

  const now = Date.now();
  const newSessionId = randomUUID();
  const session: PkSession = {
    id: newSessionId,
    attackerId,
    defenderId,
    sessionKind: "tvt",
    tvtMatchId,
    startLocation: "__tvt__",
    attacker: buildPkFighter(attackerChar as any),
    defender: buildPkFighter(defenderChar as any),
    attackerCooldowns: {},
    defenderCooldowns: {},
    log: [logLine],
    ended: false,
    attackerHasHit: false,
    defenderHasHit: false,
    createdAt: now,
    updatedAt: now,
    saved: false,
  };
  pkSessions.set(newSessionId, session);
  await savePkSessionToDb(session);
  return session;
}

async function grantTvtVictoryRewards(characterIds: string[]) {
  for (const cid of characterIds) {
    const ch = await prisma.character.findUnique({
      where: { id: cid },
      select: { id: true, name: true, race: true, classId: true, level: true, heroJson: true },
    });
    if (!ch) continue;
    const hj0 = { ...((ch.heroJson as any) || {}) };
    hj0.name = hj0.name || ch.name;
    hj0.race = hj0.race || ch.race;
    hj0.classId = hj0.classId || ch.classId;
    hj0.level = hj0.level ?? ch.level;

    const inv = Array.isArray(hj0.inventory) ? [...hj0.inventory] : [];
    const overflow = Array.isArray(hj0.overflowChest) ? [...hj0.overflowChest] : [];
    const cap = inventoryCap(hj0);
    const existing = inv.find((x: any) => (x?.id || x?.itemId) === TVT_INV_ITEM);
    if (existing) {
      existing.count = (existing.count ?? 1) + TVT_INV_QTY;
    } else if (inv.length < cap) {
      inv.push({ id: TVT_INV_ITEM, name: TVT_INV_ITEM, count: TVT_INV_QTY });
    } else {
      overflow.push({ id: TVT_INV_ITEM, name: TVT_INV_ITEM, count: TVT_INV_QTY });
    }

    const prevTvt = Number(hj0.tvtCoins ?? hj0.tvt_coins ?? 0);
    const nextBase = {
      ...hj0,
      inventory: inv,
      overflowChest: overflow,
      tvtCoins: prevTvt + TVT_TVT_COINS,
      tvt_coins: prevTvt + TVT_TVT_COINS,
    };
    const validation = validateHeroJson(nextBase);
    if (!validation.valid) {
      console.error("[tvt] grant rewards invalid heroJson", validation.errors);
      continue;
    }
    const versioned = addVersioning(nextBase, Number(hj0.heroRevision ?? 0) || 0);
    await prisma.character.update({
      where: { id: cid },
      data: {
        heroJson: versioned,
        lastActivityAt: new Date(),
      },
    });
  }
}

async function finalizeTvtMatch(match: TvtMatchState, winnerTeam: "A" | "B") {
  if (match.status === "done") return;
  match.status = "done";
  match.winnerTeam = winnerTeam;
  match.currentPkSessionId = null;
  const winners = winnerTeam === "A" ? match.teamAIds : match.teamBIds;
  await grantTvtVictoryRewards(winners);
  tvtMatches.delete(match.id);
  await persistTvtState();
}

/** Таймаут 15 хв: перемагає команда з більшою кількістю бійців у черзі; при рівності — випадково. */
export async function finalizeTvtMatchTimeout(matchId: string): Promise<void> {
  const match = tvtMatches.get(matchId);
  if (!match || match.status !== "active") return;
  let winner: "A" | "B";
  if (match.queueA.length > match.queueB.length) winner = "A";
  else if (match.queueB.length > match.queueA.length) winner = "B";
  else winner = Math.random() < 0.5 ? "A" : "B";
  await finalizeTvtMatch(match, winner);
}

function beginPickPhase(match: TvtMatchState): void {
  match.phase = "pick";
  match.currentPkSessionId = null;
  match.pickedDefenderId = null;
  match.lastPickActivityAt = Date.now();
  match.pendingAttackerId = match.attackingTeam === "A" ? match.queueA[0] ?? null : match.queueB[0] ?? null;
}

function enemyQueueForMatch(match: TvtMatchState): string[] {
  return match.attackingTeam === "A" ? [...match.queueB] : [...match.queueA];
}

/** Почати PK після вибору цілі (або авто-після AFK). */
async function startTvtFightWithDefender(match: TvtMatchState, attackerId: string, defenderId: string): Promise<void> {
  const mid = match.id;
  const logLine = `[TvT] Раунд — ${attackerId.slice(0, 8)}… vs ${defenderId.slice(0, 8)}…`;
  try {
    const session = await createTvtPkSession(attackerId, defenderId, mid, logLine);
    match.currentPkSessionId = session.id;
    match.phase = "fighting";
    match.pickedDefenderId = defenderId;
    match.pendingAttackerId = attackerId;
    tvtMatches.set(mid, match);
    await persistTvtState();
  } catch (e) {
    console.error("[tvt] startTvtFightWithDefender failed", e);
    await persistTvtState();
  }
}

async function autoPickRandomDefender(match: TvtMatchState): Promise<void> {
  if (match.phase !== "pick" || !match.pendingAttackerId) return;
  const enemy = enemyQueueForMatch(match);
  if (enemy.length === 0) return;
  const defenderId = enemy[Math.floor(Math.random() * enemy.length)];
  await startTvtFightWithDefender(match, match.pendingAttackerId, defenderId);
}

/**
 * Персонаж з облікового запису обирає противника в активному матчі.
 */
export async function pickTvtTarget(attackerId: string, defenderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = attackerId.trim();
  const d = defenderId.trim();
  if (!a || !d) return { ok: false, error: "characterId and defenderId required" };
  if (a === d) return { ok: false, error: "invalid_target" };

  let match: TvtMatchState | null = null;
  for (const m of tvtMatches.values()) {
    if (m.status !== "active") continue;
    if (m.queueA.includes(a) || m.queueB.includes(a)) {
      match = m;
      break;
    }
  }
  if (!match) return { ok: false, error: "no_match" };
  if (match.phase !== "pick") return { ok: false, error: "not_pick_phase" };
  if (match.pendingAttackerId !== a) return { ok: false, error: "not_your_turn" };
  const enemy = enemyQueueForMatch(match);
  if (!enemy.includes(d)) return { ok: false, error: "invalid_target" };

  await startTvtFightWithDefender(match, a, d);
  return { ok: true };
}

export async function onTvtPkSessionEnded(session: PkSession): Promise<void> {
  const mid = session.tvtMatchId;
  if (!mid || !session.winnerId) return;
  const match = tvtMatches.get(mid);
  if (!match || match.status !== "active") return;

  const loserId = session.winnerId === session.attackerId ? session.defenderId : session.attackerId;
  if (match.queueA.includes(loserId)) {
    match.queueA = match.queueA.filter((x) => x !== loserId);
  } else if (match.queueB.includes(loserId)) {
    match.queueB = match.queueB.filter((x) => x !== loserId);
  } else {
    return;
  }

  match.currentPkSessionId = null;
  match.attackingTeam = match.attackingTeam === "A" ? "B" : "A";
  beginPickPhase(match);
  tvtMatches.set(mid, match);

  if (match.queueA.length === 0) {
    await finalizeTvtMatch(match, "B");
    return;
  }
  if (match.queueB.length === 0) {
    await finalizeTvtMatch(match, "A");
    return;
  }

  await persistTvtState();
}

export async function abortTvtMatchOnFlee(session: PkSession): Promise<void> {
  const mid = session.tvtMatchId;
  if (!mid) return;
  const match = tvtMatches.get(mid);
  if (!match) return;
  tvtMatches.delete(mid);
  await persistTvtState();
}

export function collectRegisteredForSlot(dayKey: string, slotId: string): string[] {
  const out: string[] = [];
  for (const [cid, v] of tvtRegistrations.entries()) {
    if (v.dayKey === dayKey && v.slotId === slotId) out.push(cid);
  }
  return out;
}

export async function tryStartTvtMatchForSlot(dayKey: string, slotId: string): Promise<void> {
  const key = regKey(dayKey, slotId);
  const now = new Date();
  const slotDef = TVT_DAILY_SLOTS.find((s) => s.id === slotId);
  if (!slotDef) return;

  const participantIdsEarly = collectRegisteredForSlot(dayKey, slotId);
  const activeForSlot = [...tvtMatches.values()].some(
    (m) => m.dayKey === dayKey && m.slotId === slotId && m.status === "active"
  );
  /** Залиплий startedSlots без матчу (стара помилка / KV) — скидаємо, якщо є ≥2 записаних і ще вікно старту. */
  if (
    tvtStartedSlots.has(key) &&
    !activeForSlot &&
    participantIdsEarly.length >= 2 &&
    isBattleStartWindow(now, slotDef)
  ) {
    tvtStartedSlots.delete(key);
    await persistTvtState();
  }

  if (tvtStartedSlots.has(key)) return;

  const participantIds = collectRegisteredForSlot(dayKey, slotId);
  if (participantIds.length < 2) {
    /** 0 учасників: не позначаємо слот як «стартанув» — інакше наступні тики ніколи не створять матч (гонка з порожньою Map). */
    if (participantIds.length === 0) {
      await persistTvtState();
      return;
    }
    /** 1 учасник — закриваємо слот без матчу */
    tvtStartedSlots.add(key);
    for (const cid of participantIds) {
      tvtRegistrations.delete(cid);
    }
    await persistTvtState();
    return;
  }

  const split = splitTeamIds(participantIds);
  if (!split) {
    for (const cid of participantIds) tvtRegistrations.delete(cid);
    tvtStartedSlots.add(key);
    await persistTvtState();
    return;
  }

  for (const cid of participantIds) tvtRegistrations.delete(cid);

  const matchId = randomUUID();
  const createdAt = Date.now();
  const match: TvtMatchState = {
    id: matchId,
    dayKey,
    slotId,
    teamAIds: [...split.teamA],
    teamBIds: [...split.teamB],
    queueA: [...split.teamA],
    queueB: [...split.teamB],
    status: "active",
    winnerTeam: null,
    currentPkSessionId: null,
    createdAt,
    matchEndsAt: createdAt + TVT_MATCH_MAX_MS,
    phase: "pick",
    attackingTeam: "A",
    pendingAttackerId: null,
    pickedDefenderId: null,
    lastPickActivityAt: Date.now(),
  };
  beginPickPhase(match);
  tvtMatches.set(matchId, match);
  tvtStartedSlots.add(key);
  await persistTvtState();
}

export function runTvtTick(): void {
  const now = new Date();
  const dayKey = dayKeyFromDate(now);
  for (const slot of TVT_DAILY_SLOTS) {
    if (!isBattleStartWindow(now, slot)) continue;
    void tryStartTvtMatchForSlot(dayKey, slot.id);
  }
  const t = Date.now();
  for (const [mid, match] of [...tvtMatches.entries()]) {
    if (match.status !== "active") continue;
    const ends = match.matchEndsAt ?? match.createdAt + TVT_MATCH_MAX_MS;
    if (t > ends) {
      void finalizeTvtMatchTimeout(mid);
      continue;
    }
    if (match.phase === "pick" && match.pendingAttackerId && t - match.lastPickActivityAt > TVT_PICK_AFK_MS) {
      void (async () => {
        const m = tvtMatches.get(mid);
        if (!m || m.status !== "active" || m.phase !== "pick" || !m.pendingAttackerId) return;
        if (Date.now() - m.lastPickActivityAt <= TVT_PICK_AFK_MS) return;
        await autoPickRandomDefender(m);
      })();
    }
  }
}
