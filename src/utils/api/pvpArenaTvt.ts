import { apiRequest } from "./core";

export interface ResolvePkResultRequest {
  attackerId: string;
  targetId: string;
  winnerId: string;
}

export interface ResolvePkResultResponse {
  ok: boolean;
  winnerId: string;
  loserId: string;
}

export async function resolvePkResult(request: ResolvePkResultRequest): Promise<ResolvePkResultResponse> {
  return apiRequest<ResolvePkResultResponse>("/characters/pk/resolve", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export interface PkSessionSkill {
  id: number;
  level: number;
  mpCost: number;
  cooldownMs: number;
  powerBonus: number;
}

export interface PkSessionFighter {
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
  /** З сервера buildPkFighter — для стихій / дебафів опору в PK */
  accuracy?: number;
  evasion?: number;
  crit?: number;
  mCrit?: number;
  critPower?: number;
  attackSpeed?: number;
  fireResist?: number;
  waterResist?: number;
  windResist?: number;
  earthResist?: number;
  holyResist?: number;
  darkResist?: number;
  prefersMagic: boolean;
  skills: PkSessionSkill[];
  /** heroJson.heroBuffs знімок з сервера (PK) */
  buffs?: Array<{
    id?: number;
    name?: string;
    icon?: string;
    effects?: any[];
    expiresAt?: number;
    startedAt?: number;
    durationMs?: number;
    stackType?: string;
    buffGroup?: string;
    source?: string;
  }>;
}

export interface PkSessionState {
  id: string;
  attackerId: string;
  defenderId: string;
  sessionKind?: "pk" | "arena" | "tvt";
  attacker: PkSessionFighter;
  defender: PkSessionFighter;
  /** Cooldowns атакуючого (для зворотної сумісності) */
  cooldowns: Record<number, number>;
  /** Відкати атакуючого */
  attackerCooldowns?: Record<number, number>;
  /** Відкати захищаючого */
  defenderCooldowns?: Record<number, number>;
  log: string[];
  ended: boolean;
  winnerId: string | null;
  /** Останній урон у сесії (сервер); для відображення смерті як у PvE */
  lastHitDamage?: number;
  escapedById?: string | null;
  escapedByName?: string | null;
  updatedAt: number;
}

export interface PkSessionResponse {
  ok: boolean;
  serverNow?: number;
  session: PkSessionState;
  /** Оновлені бафи актора після застосування баф-скілу в PK (для миттєвого відображення) */
  actorBuffs?: Array<{ id?: number; name?: string; effects?: any[]; expiresAt: number; startedAt?: number; durationMs?: number }>;
}

export interface PkIncomingNotice {
  attackerId: string;
  attackerName: string;
  attackerNickColor?: string;
  sessionId?: string;
  until: number;
}

export interface PkDeathNotice {
  killerId: string;
  killerName: string;
  killerNickColor?: string | null;
  lastDamage?: number;
  log?: string[];
  at: number;
  until: number;
}

export interface PkStateResponse {
  ok: boolean;
  hp: number;
  mp: number;
  cp: number;
  maxHp: number;
  maxMp: number;
  maxCp: number;
  nickColor: string | null;
  pkIncoming: PkIncomingNotice | null;
  pkDeathNotice: PkDeathNotice | null;
  pkSyncActive: boolean;
}

export async function startPkSession(
  attackerId: string,
  targetId: string,
  attackerStats?: { hp?: number; maxHp?: number; mp?: number; maxMp?: number }
): Promise<PkSessionResponse> {
  return apiRequest<PkSessionResponse>("/characters/pk/session/start", {
    method: "POST",
    body: JSON.stringify({
      attackerId,
      targetId,
      ...(attackerStats?.maxHp != null && { attackerMaxHp: attackerStats.maxHp }),
      ...(attackerStats?.hp != null && { attackerHp: attackerStats.hp }),
      ...(attackerStats?.maxMp != null && { attackerMaxMp: attackerStats.maxMp }),
      ...(attackerStats?.mp != null && { attackerMp: attackerStats.mp }),
    }),
  });
}

export async function syncPkStats(
  sessionId: string,
  stats: { hp?: number; maxHp?: number; mp?: number; maxMp?: number; logMessage?: string }
): Promise<PkSessionResponse> {
  return apiRequest<PkSessionResponse>(`/characters/pk/session/${encodeURIComponent(sessionId)}/sync-stats`, {
    method: "POST",
    body: JSON.stringify(stats),
  });
}

export async function getPkSession(sessionId: string): Promise<PkSessionResponse> {
  return apiRequest<PkSessionResponse>(`/characters/pk/session/${encodeURIComponent(sessionId)}`, {
    method: "GET",
  });
}

export async function actPkSession(
  sessionId: string, 
  skillId?: number, 
  options?: {
    isBuff?: boolean;
    isToggle?: boolean;
    isDebuff?: boolean;
    name?: string;
    target?: string;
    shotMultiplier?: number;
    shotName?: string;
    buffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>;
    debuffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>;
    buffCooldownMs?: number;
    buffDurationSec?: number;
    /** З skillDef.cooldown — сервер рахує фіз. КД через attackSpeed */
    skillBaseCooldownSec?: number;
    isMagicAttack?: boolean;
    /** skillDef.element для magic_attack / стихійного урону */
    skillElement?: string;
  }
): Promise<PkSessionResponse> {
  return apiRequest<PkSessionResponse>(`/characters/pk/session/${encodeURIComponent(sessionId)}/act`, {
    method: "POST",
    body: JSON.stringify({ skillId, ...options }),
  });
}

/** Уйти с арены во время боя — соперник получит «… сбежал!». */
export async function arenaFleePkSession(sessionId: string): Promise<PkSessionResponse> {
  return apiRequest<PkSessionResponse>(`/characters/pk/session/${encodeURIComponent(sessionId)}/arena-flee`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getPkState(characterId: string): Promise<PkStateResponse> {
  return apiRequest<PkStateResponse>(`/characters/${encodeURIComponent(characterId)}/pk/state`, {
    method: "GET",
  });
}

export interface ArenaFieldPlayer {
  id: string;
  name: string;
  level: number;
  /** Эффективный цвет ника (колонка + heroJson, без 7 печатей — см. sevenSealsRank) */
  nickColor?: string;
  /** 1–3 если активен бонус победителя 7 печатей */
  sevenSealsRank?: number;
}

export interface ArenaFieldResponse {
  ok: boolean;
  players: ArenaFieldPlayer[];
  count: number;
}

/** Список гравців на полі; `characterId` — heartbeat (оновлює lastSeen, якщо ви на полі) */
export async function getArenaField(characterId?: string): Promise<ArenaFieldResponse> {
  const q =
    characterId != null && characterId !== ""
      ? `?characterId=${encodeURIComponent(characterId)}`
      : "";
  return apiRequest<ArenaFieldResponse>(`/arena/field${q}`, { method: "GET" });
}

export async function joinArenaField(characterId: string): Promise<ArenaFieldResponse> {
  return apiRequest<ArenaFieldResponse>("/arena/field/join", {
    method: "POST",
    body: JSON.stringify({ characterId }),
  });
}

export async function leaveArenaField(characterId?: string): Promise<ArenaFieldResponse> {
  return apiRequest<ArenaFieldResponse>("/arena/field/leave", {
    method: "POST",
    body: JSON.stringify(characterId ? { characterId } : {}),
  });
}

/** Незавершённый бой арены для этого персонажа (защитник переходит в матч автоматически). */
export async function getArenaActiveSession(characterId: string): Promise<{ ok: boolean; sessionId: string | null }> {
  return apiRequest<{ ok: boolean; sessionId: string | null }>(
    `/arena/active-session?characterId=${encodeURIComponent(characterId)}`,
    { method: "GET" }
  );
}

export type TvtSlotDef = {
  id: string;
  label: string;
  registrationOpen: { h: number; m: number };
  battleStart: { h: number; m: number };
};

export interface TvtStateResponse {
  ok: boolean;
  serverNow: number;
  /** Хвилини від півночі в ігровій зоні (Europe/Warsaw), як на бекенді для TvT; TvT UI синхронізує фази з цим полем + serverNow. */
  serverMinutesSinceMidnight: number;
  dayKey: string;
  slots: TvtSlotDef[];
  /** Кількість записаних персонажів по слоту (без id). */
  registrationsBySlot: Record<string, number>;
  /** Є хоча б один активний матч TvT сьогодні (щоб UI не писав «бій», якщо матчу немає). */
  hasActiveMatch: boolean;
  myRegistration: { dayKey: string; slotId: string } | null;
  myMatch: {
    id: string;
    slotId: string;
    queueALen: number;
    queueBLen: number;
    currentPkSessionId: string | null;
    status: string;
  } | null;
  /** Склад команд у матчі — лише з JWT + characterId. */
  myMatchDetail?: {
    matchId: string;
    slotId: string;
    phase: "pick" | "fighting";
    mySide: "A" | "B";
    teamA: Array<{ id: string; name: string; level: number }>;
    teamB: Array<{ id: string; name: string; level: number }>;
    canStartFight: boolean;
    currentPkSessionId: string | null;
  } | null;
}

/** Без characterId — лише публічні поля (час сервера, слоти, лічильники). З id — myRegistration/myMatch при валідному JWT. */
export async function getTvtState(characterId?: string): Promise<TvtStateResponse> {
  const id = characterId?.trim();
  const q = id ? `?characterId=${encodeURIComponent(id)}` : "";
  return apiRequest<TvtStateResponse>(`/characters/tvt/state${q}`, { method: "GET" });
}

export async function registerTvt(
  characterId: string,
  slotId: string
): Promise<{ ok: boolean; serverNow?: number; dayKey?: string; slotId?: string }> {
  return apiRequest(`/characters/tvt/register`, {
    method: "POST",
    body: JSON.stringify({ characterId, slotId }),
  });
}

export async function unregisterTvt(characterId: string): Promise<{ ok: boolean; serverNow?: number }> {
  return apiRequest(`/characters/tvt/unregister`, {
    method: "POST",
    body: JSON.stringify({ characterId }),
  });
}

export async function pickTvtTarget(
  characterId: string,
  defenderId: string
): Promise<{ ok: boolean; serverNow?: number }> {
  return apiRequest(`/characters/tvt/pick-target`, {
    method: "POST",
    body: JSON.stringify({ characterId, defenderId }),
  });
}

export interface ArenaChallengeResponse {
  ok: boolean;
  sessionId: string;
  session?: PkSessionState;
}

export async function arenaChallenge(
  characterId: string,
  targetId: string,
  attackerStats?: { hp?: number; maxHp?: number; mp?: number; maxMp?: number }
): Promise<ArenaChallengeResponse> {
  return apiRequest<ArenaChallengeResponse>("/arena/challenge", {
    method: "POST",
    body: JSON.stringify({
      characterId,
      targetId,
      ...(attackerStats?.maxHp != null && { attackerMaxHp: attackerStats.maxHp }),
      ...(attackerStats?.hp != null && { attackerHp: attackerStats.hp }),
      ...(attackerStats?.maxMp != null && { attackerMaxMp: attackerStats.maxMp }),
      ...(attackerStats?.mp != null && { attackerMp: attackerStats.mp }),
    }),
  });
}

export interface ArenaLbRow {
  characterId: string;
  wins: number;
  losses: number;
  name: string | null;
  level: number | null;
}

export async function getArenaLeaderboard(): Promise<{ ok: boolean; top: ArenaLbRow[] }> {
  return apiRequest<{ ok: boolean; top: ArenaLbRow[] }>("/arena/leaderboard", { method: "GET" });
}

export interface PvpStatsResponse {
  ok: boolean;
  arenaTop: ArenaLbRow[];
  pkTop: Array<{ characterId: string; name: string | null; level: number | null; wins: number; losses: number }>;
  arenaTotals: { fights: number; accounts: number };
}

export async function getPvpStats(): Promise<PvpStatsResponse> {
  return apiRequest<PvpStatsResponse>("/pvp/stats", { method: "GET" });
}
