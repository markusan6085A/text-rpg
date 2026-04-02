import { prisma } from "../../../../db";
import { getEffectiveNickColor } from "../../../../effectiveNickColor";
import { isArenaLikeSession } from "./types";
import { pkSessions } from "./store";

/** Поле арени: багато гравців одночасно, бій починається вручну (challenge) */
export type ArenaFieldEntry = { accountId: string; name: string; level: number; lastSeen: number };
export const arenaField = new Map<string, ArenaFieldEntry>();
export const ARENA_FIELD_IDLE_MS = 50_000;
export const ARENA_FIELD_MAX = 200;

export function pruneArenaField() {
  const now = Date.now();
  for (const [id, e] of [...arenaField.entries()]) {
    if (now - e.lastSeen > ARENA_FIELD_IDLE_MS) arenaField.delete(id);
  }
}

export async function hasActiveArenaSession(characterId: string): Promise<boolean> {
  for (const s of pkSessions.values()) {
    if (!s.ended && isArenaLikeSession(s) && (s.attackerId === characterId || s.defenderId === characterId)) {
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
      if (p && (p.sessionKind === "arena" || p.sessionKind === "tvt")) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function activeSevenSealsRankFromBonus(bonus: unknown): number | null {
  if (!bonus || typeof bonus !== "object") return null;
  const b = bonus as { rank?: number; expiresAt?: number };
  const rank = Number(b.rank);
  const expiresAt = Number(b.expiresAt ?? 0);
  if (rank >= 1 && rank <= 3 && expiresAt > Date.now()) return rank;
  return null;
}

export async function enrichArenaFieldPlayers(): Promise<
  Array<{ id: string; name: string; level: number; nickColor?: string; sevenSealsRank?: number }>
> {
  const entries = [...arenaField.entries()];
  if (entries.length === 0) return [];
  const ids = entries.map(([id]) => id);
  let chars: Array<{ id: string; nickColor: string | null; heroJson: unknown }> = [];
  try {
    chars = await prisma.character.findMany({
      where: { id: { in: ids } },
      select: { id: true, nickColor: true, heroJson: true },
    });
  } catch {
    return entries.map(([id, v]) => ({ id, name: v.name, level: v.level }));
  }
  const byId = new Map(chars.map((c) => [c.id, c]));
  return entries.map(([id, v]) => {
    const c = byId.get(id);
    const heroJson = (c?.heroJson as any) || {};
    const nickColor = getEffectiveNickColor(heroJson, c?.nickColor ?? null);
    const sevenSealsRank = activeSevenSealsRankFromBonus(heroJson?.sevenSealsBonus);
    const row: { id: string; name: string; level: number; nickColor?: string; sevenSealsRank?: number } = {
      id,
      name: v.name,
      level: v.level,
    };
    if (nickColor) row.nickColor = nickColor;
    if (sevenSealsRank != null) row.sevenSealsRank = sevenSealsRank;
    return row;
  });
}
