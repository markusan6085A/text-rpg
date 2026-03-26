import { prisma } from "../../../../db";
import { TVT_MATCH_MAX_MS, dayKeyFromDate } from "./schedule";
import type { TvtMatchPhase } from "./types";
import { tvtMatches, tvtRegistrations, tvtStartedSlots } from "./store";
import type { TvtMatchState } from "./types";

const KV_KEY = "tvt_state_v1";

type PersistedV1 = {
  v: 1;
  registrations: { characterId: string; dayKey: string; slotId: string }[];
  startedSlots: string[];
  matches: TvtMatchState[];
};

function normalizeMatch(m: TvtMatchState): TvtMatchState {
  const ends =
    typeof m.matchEndsAt === "number" && Number.isFinite(m.matchEndsAt)
      ? m.matchEndsAt
      : (m.createdAt || Date.now()) + TVT_MATCH_MAX_MS;
  const phase: TvtMatchPhase =
    m.phase === "pick" || m.phase === "fighting"
      ? m.phase
      : m.currentPkSessionId
        ? "fighting"
        : "pick";
  const attackingTeam = m.attackingTeam === "A" || m.attackingTeam === "B" ? m.attackingTeam : "A";
  const pendingAttackerId =
    typeof m.pendingAttackerId === "string"
      ? m.pendingAttackerId
      : attackingTeam === "A"
        ? m.queueA[0] ?? null
        : m.queueB[0] ?? null;
  const pickedDefenderId = typeof m.pickedDefenderId === "string" ? m.pickedDefenderId : null;
  const lastPickActivityAt =
    typeof m.lastPickActivityAt === "number" && Number.isFinite(m.lastPickActivityAt)
      ? m.lastPickActivityAt
      : Date.now();
  return {
    ...m,
    matchEndsAt: ends,
    phase,
    attackingTeam,
    pendingAttackerId,
    pickedDefenderId,
    lastPickActivityAt,
  };
}

/** Завантажити з БД у in-memory maps (тільки записи поточного dayKey). */
export async function loadTvtStateFromDb(): Promise<void> {
  const row = await prisma.kv.findUnique({ where: { key: KV_KEY } });
  if (!row?.value) return;
  let data: PersistedV1;
  try {
    data = JSON.parse(row.value) as PersistedV1;
  } catch {
    return;
  }
  if (data.v !== 1 || !Array.isArray(data.registrations)) return;

  const dk = dayKeyFromDate(new Date());

  tvtRegistrations.clear();
  for (const r of data.registrations) {
    if (r.dayKey !== dk) continue;
    tvtRegistrations.set(r.characterId, { dayKey: r.dayKey, slotId: r.slotId });
  }

  tvtStartedSlots.clear();
  for (const k of data.startedSlots ?? []) {
    if (typeof k !== "string") continue;
    if (!k.startsWith(`${dk}_`)) continue;
    tvtStartedSlots.add(k);
  }

  tvtMatches.clear();
  for (const raw of data.matches ?? []) {
    if (!raw || raw.dayKey !== dk) continue;
    if (raw.status === "done") continue;
    const m = normalizeMatch(raw);
    tvtMatches.set(m.id, m);
  }
}

export async function persistTvtState(): Promise<void> {
  const registrations = [...tvtRegistrations.entries()].map(([characterId, v]) => ({
    characterId,
    dayKey: v.dayKey,
    slotId: v.slotId,
  }));
  const startedSlots = [...tvtStartedSlots];
  const matches = [...tvtMatches.values()];
  const payload: PersistedV1 = {
    v: 1,
    registrations,
    startedSlots,
    matches,
  };
  try {
    await prisma.kv.upsert({
      where: { key: KV_KEY },
      create: { key: KV_KEY, value: JSON.stringify(payload) },
      update: { value: JSON.stringify(payload) },
    });
  } catch (e) {
    console.error("[tvt] persist failed", e);
  }
}
