import { apiRequest } from "./core";

export type LeaderboardType = 'level' | 'sp' | 'clan';

export interface LeaderboardItemLevel {
  rank: number;
  characterId: string;
  name: string;
  level: number;
  exp: number;
  nickColor?: string | null;
  clanName?: string | null;
}

export interface LeaderboardItemSp {
  rank: number;
  characterId: string;
  name: string;
  level: number;
  sp: number;
  nickColor?: string | null;
  clanName?: string | null;
}

export interface LeaderboardItemClan {
  rank: number;
  id: string;
  name: string;
  level: number;
  reputation: number;
  emblem?: string | null;
  memberCount: number;
}

export interface LeaderboardResponse {
  ok: boolean;
  type: LeaderboardType;
  items: LeaderboardItemLevel[] | LeaderboardItemSp[] | LeaderboardItemClan[];
}

export async function getLeaderboard(type: LeaderboardType = 'level', limit = 50): Promise<LeaderboardResponse> {
  return apiRequest<LeaderboardResponse>(`/leaderboard?type=${encodeURIComponent(type)}&limit=${limit}`, { method: 'GET' });
}

// Seven Seals API
export interface SevenSealsRankingResponse {
  ok: boolean;
  ranking: Array<{
    characterId: string;
    characterName: string;
    medalCount: number;
    rank: number;
  }>;
  myRank: number | null;
  myMedals: number;
  /** true під час паузи (нд або сб 22:00+, Варшава) — дроп медалей вимкнено */
  weekPaused?: boolean;
}

export async function getSevenSealsRanking(): Promise<SevenSealsRankingResponse> {
  const response = await apiRequest<SevenSealsRankingResponse>('/seven-seals/ranking', {
    method: 'GET',
  });
  return response;
}

export async function reportMedalDrop(characterId: string): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>('/seven-seals/medal', {
    method: 'POST',
    body: JSON.stringify({ characterId }),
  });
  return response;
}

export interface SevenSealsRankResponse {
  ok: boolean;
  /** Статус «переможець» лише з активного бонусу після офіційної видачі */
  rank: number | null;
  medalCount: number;
  /** Поточний тиждень: місце в таблиці без статусу переможця */
  provisionalRank?: number | null;
  fromClaimedBonus?: boolean;
  /** Можна забрати нагороду за щойно закритий тиждень (топ-3), якщо ще не claimedWeekStart */
  canClaimLastWeek?: boolean;
}

export async function getSevenSealsRank(characterId: string): Promise<SevenSealsRankResponse> {
  try {
    const response = await apiRequest<SevenSealsRankResponse>(`/seven-seals/rank/${characterId}`, {
      method: 'GET',
    });
    return response;
  } catch (err: any) {
    // 404 = route not found (production server may not have seven-seals yet)
    if (err?.status === 404) {
      return { ok: false, rank: null, medalCount: 0, canClaimLastWeek: false };
    }
    throw err;
  }
}

export async function claimSevenSealsReward(characterId: string): Promise<{
  ok: boolean;
  alreadyClaimed?: boolean;
  bonus?: { pAtk: number; mAtk: number; pDef: number; mDef: number; rank: number; coinLuck?: number };
}> {
  const response = await apiRequest<any>(`/seven-seals/claim`, {
    method: 'POST',
    body: JSON.stringify({ characterId }),
  });
  return response;
}
