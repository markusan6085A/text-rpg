import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { addVersioning } from "../../../../heroJsonValidator";
import type { PkSession } from "../pk/types";
import { buildPkFighter } from "../pk/helpers";
import { pkSessions, savePkSessionToDb } from "../pk/store";
import { TVT_DAILY_SLOTS, TVT_MATCH_MAX_MS, dayKeyFromDate, isBattleStartWindow } from "./schedule";
import { persistTvtState } from "./persistence";
import { tvtMatches, tvtRegistrations, tvtStartedSlots, regKey } from "./store";
import type { TvtMatchState } from "./types";

const TVT_COIN_LUCK = 2;
const TVT_TVT_COINS = 2;

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
      select: { id: true, heroJson: true, coinLuck: true },
    });
    if (!ch) continue;
    const hj = ((ch.heroJson as any) || {}) as any;
    const prevTvt = Number(hj.tvtCoins ?? hj.tvt_coins ?? 0);
    const nextJson = addVersioning(
      {
        ...hj,
        tvtCoins: prevTvt + TVT_TVT_COINS,
        tvt_coins: prevTvt + TVT_TVT_COINS,
      },
      Number(hj.heroRevision ?? 0) || 0
    );
    await prisma.character.update({
      where: { id: cid },
      data: {
        coinLuck: { increment: TVT_COIN_LUCK },
        heroJson: nextJson,
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

/** Наступний раунд: голова queueA проти queueB (attacker A, defender B) */
export async function startNextTvtRound(matchId: string): Promise<void> {
  const match = tvtMatches.get(matchId);
  if (!match || match.status !== "active") return;

  if (match.queueA.length === 0) {
    await finalizeTvtMatch(match, "B");
    return;
  }
  if (match.queueB.length === 0) {
    await finalizeTvtMatch(match, "A");
    return;
  }

  const attackerId = match.queueA[0];
  const defenderId = match.queueB[0];
  const logLine = `[TvT] Раунд — ${attackerId.slice(0, 8)}… vs ${defenderId.slice(0, 8)}…`;
  try {
    const session = await createTvtPkSession(attackerId, defenderId, matchId, logLine);
    match.currentPkSessionId = session.id;
    tvtMatches.set(matchId, match);
    await persistTvtState();
  } catch (e) {
    console.error("[tvt] startNextTvtRound failed", e);
    await persistTvtState();
  }
}

export async function onTvtPkSessionEnded(session: PkSession): Promise<void> {
  const mid = session.tvtMatchId;
  if (!mid || !session.winnerId) return;
  const match = tvtMatches.get(mid);
  if (!match || match.status !== "active") return;

  const a0 = match.queueA[0];
  const b0 = match.queueB[0];
  if (!a0 || !b0) return;

  if (session.winnerId === a0) {
    match.queueB.shift();
  } else if (session.winnerId === b0) {
    match.queueA.shift();
  } else {
    return;
  }

  match.currentPkSessionId = null;
  tvtMatches.set(mid, match);

  if (match.queueA.length === 0) {
    await finalizeTvtMatch(match, "B");
    return;
  }
  if (match.queueB.length === 0) {
    await finalizeTvtMatch(match, "A");
    return;
  }

  await startNextTvtRound(mid);
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
  if (tvtStartedSlots.has(key)) return;

  const participantIds = collectRegisteredForSlot(dayKey, slotId);
  if (participantIds.length < 2) {
    tvtStartedSlots.add(key);
    for (const cid of participantIds) {
      tvtRegistrations.delete(cid);
    }
    await persistTvtState();
    return;
  }

  tvtStartedSlots.add(key);

  const split = splitTeamIds(participantIds);
  if (!split) {
    for (const cid of participantIds) tvtRegistrations.delete(cid);
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
  };
  tvtMatches.set(matchId, match);
  await startNextTvtRound(matchId);
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
    if (t <= ends) continue;
    void finalizeTvtMatchTimeout(mid);
  }
}
