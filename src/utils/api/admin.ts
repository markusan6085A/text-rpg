import { API_URL, ApiError } from "./core";

// ——— Admin API (cookie admin_session, без токенів у фронті) ———

export async function adminLogin(login: string, password: string): Promise<{ ok: boolean; accessToken?: string }> {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Login failed") as any;
    err.status = res.status;
    throw err;
  }
  return { ok: true, accessToken: data.accessToken };
}

/** Перевірка адміна — завжди 200 (немає 401 у Network для не-адмінів) */
export async function adminCheck(): Promise<{ ok: boolean; admin: { login?: string } | null }> {
  const res = await fetch(`${API_URL}/admin/auth/check`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ ok: false, admin: null }));
  if (!res.ok) return { ok: false, admin: null };
  return data;
}

export async function adminMe(): Promise<{ ok: boolean; admin: { login?: string } }> {
  const res = await fetch(`${API_URL}/admin/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Unauthorized") as any;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function adminStats(): Promise<{ ok: boolean; uptimeSec?: number; nodeEnv?: string }> {
  const res = await fetch(`${API_URL}/admin/stats`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return data;
}

export interface AdminActionLog {
  id: string;
  createdAt: string;
  adminLogin: string;
  action: string;
  targetCharacterId?: string | null;
  targetCharacterName?: string | null;
  status: string;
  message?: string | null;
  before?: any;
  after?: any;
  metadata?: any;
}

export interface AdminActionLogsResponse {
  ok: boolean;
  logs: AdminActionLog[];
  total: number;
  page: number;
  limit: number;
}

export type PlayerActivityLogRow = {
  id: string;
  createdAt: string;
  accountId: string;
  characterId: string;
  characterName: string;
  action: string;
  metadata: Record<string, unknown>;
  clientIp: string | null;
};

export async function getPlayerActivityLogs(params?: {
  characterId?: string;
  characterName?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ ok: boolean; logs: PlayerActivityLogRow[]; total: number; page: number; limit: number }> {
  const q = new URLSearchParams();
  if (params?.characterId) q.set("characterId", params.characterId);
  if (params?.characterName) q.set("characterName", params.characterName);
  if (params?.action) q.set("action", params.action);
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const query = q.toString();
  const res = await fetch(`${API_URL}/admin/activity${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return data as { ok: boolean; logs: PlayerActivityLogRow[]; total: number; page: number; limit: number };
}

export async function getPlayerActivityRhythm(params: {
  characterId?: string;
  characterName?: string;
  limit?: number;
}): Promise<{
  ok: boolean;
  characterId: string;
  syncEventsWithMobProgress: number;
  summary: {
    count: number;
    minMs: number;
    maxMs: number;
    avgMs: number;
    minLabel: string;
    maxLabel: string;
    avgLabel: string;
  } | null;
}> {
  const q = new URLSearchParams();
  if (params.characterId?.trim()) q.set("characterId", params.characterId.trim());
  if (params.characterName?.trim()) q.set("characterName", params.characterName.trim());
  if (params.limit != null) q.set("limit", String(params.limit));
  const res = await fetch(`${API_URL}/admin/activity/rhythm?${q.toString()}`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return data as any;
}

export type AdminSignalFinding = {
  characterId: string;
  characterName: string;
  accountId: string;
  signals: Array<{ kind: string; detail: string; severity: "low" | "medium" | "high" }>;
};

export async function getAdminSignalsAnalyze(hours?: number): Promise<{
  ok: boolean;
  hours: number;
  logRowCount: number;
  logRowCap: number;
  findings: AdminSignalFinding[];
  inGameLetterConfigured: boolean;
  emailConfigured: boolean;
  generatedAt: string;
  thresholds: Record<string, number>;
}> {
  const q = new URLSearchParams();
  if (hours != null) q.set("hours", String(hours));
  const query = q.toString();
  const res = await fetch(`${API_URL}/admin/signals/analyze${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return data as {
    ok: boolean;
    hours: number;
    logRowCount: number;
    logRowCap: number;
    findings: AdminSignalFinding[];
    inGameLetterConfigured: boolean;
    emailConfigured: boolean;
    generatedAt: string;
    thresholds: Record<string, number>;
  };
}

export async function getAdminActionLogs(params?: {
  action?: string;
  adminLogin?: string;
  target?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<AdminActionLogsResponse> {
  const q = new URLSearchParams();
  if (params?.action) q.set("action", params.action);
  if (params?.adminLogin) q.set("adminLogin", params.adminLogin);
  if (params?.target) q.set("target", params.target);
  if (params?.status) q.set("status", params.status);
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const query = q.toString();
  const res = await fetch(`${API_URL}/admin/logs${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return data as AdminActionLogsResponse;
}

export async function adminLogout(): Promise<void> {
  await fetch(`${API_URL}/admin/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

/** Адмін: видалити будь-яке повідомлення чату */
export async function adminDeleteChatMessage(messageId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/chat/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return { ok: true };
}

/** Адмін: замьютити гравця в чаті на N хвилин */
export async function adminMuteChatUser(characterId: string, durationMinutes: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/chat/mute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterId, durationMinutes }),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as ApiError).error || "Forbidden") as any;
    err.status = res.status;
    throw err;
  }
  return { ok: true };
}

/** Адмін: знайти гравця за ніком */
export async function adminFindPlayerByName(name: string): Promise<{ ok: boolean; character?: { id: string; name: string; accountId: string; level: number; adena: number; coinLuck: number; coinsSilver?: number; bannedUntil: string | null; blockedUntil: string | null; sex?: string; profession?: string | null } }> {
  const res = await fetch(`${API_URL}/admin/player/find-by-name?name=${encodeURIComponent(name)}&_=${Date.now()}`, { method: "GET", credentials: "include", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

export async function adminGetPlayerInventory(characterId: string): Promise<{ ok: boolean; inventory: any[] }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/inventory`, { method: "GET", credentials: "include", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: видати/забрати предмет (slot опційно — з itemsDB для коректного відображення) */
export async function adminGiveItem(characterId: string, itemId: string, qty: number, slot?: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/give-item`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, qty, slot }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}
export async function adminTakeItem(characterId: string, itemId: string, qty: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/take-item`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, qty }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: встановити рівень (0–80) */
export async function adminSetLevel(characterId: string, level: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/set-level`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: адена (delta або set) */
export async function adminAdena(characterId: string, delta?: number, set?: number): Promise<{ ok: boolean; adena?: number }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/adena`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta, set }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: Coin of Luck (delta або set) */
export async function adminCoinLuck(characterId: string, delta?: number, set?: number): Promise<{ ok: boolean; coinLuck?: number }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/coin-luck`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta, set }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: Серебряные Монеты (delta або set) */
export async function adminCoinsSilver(characterId: string, delta?: number, set?: number): Promise<{ ok: boolean; coinsSilver?: number }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/coins-silver`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta, set }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: force logout за ніком або characterId */
export async function adminForceLogout(characterIdOrName: string): Promise<{ ok: boolean }> {
  const isLikelyCuid = characterIdOrName.length > 20 && characterIdOrName.includes("-");
  const body = isLikelyCuid ? { characterId: characterIdOrName } : { name: characterIdOrName };
  const res = await fetch(`${API_URL}/admin/player/force-logout`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: бан / розбан */
export async function adminBan(characterId: string, durationMinutes: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/ban`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationMinutes }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}
export async function adminUnban(characterId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/unban`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: блок / розблок */
export async function adminBlock(characterId: string, durationMinutes: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/block`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationMinutes }), credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}
export async function adminUnblock(characterId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/unblock`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: повне лікування (hp/mp/cp = max) */
export async function adminHeal(characterId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/heal`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: воскресити персонажа */
export async function adminResurrect(characterId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/resurrect`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: встановити преміум (days або until timestamp) */
export async function adminSetPremium(characterId: string, days?: number, until?: number): Promise<{ ok: boolean; premiumUntil?: number }> {
  const body = days != null ? { days } : until != null ? { until } : {};
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/premium`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: змінити клас/професію персонажа */
export async function adminChangeClass(
  characterId: string,
  newProfession: string,
  skills: Array<{ id: number; level: number }>,
  sex?: string
): Promise<{ ok: boolean }> {
  const body: { newProfession: string; skills: Array<{ id: number; level: number }>; sex?: string } = { newProfession, skills };
  if (sex) body.sex = sex;
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/change-class`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: пошук персонажів */
export async function adminSearchPlayers(params?: { name?: string; page?: number; limit?: number }): Promise<{
  ok: boolean;
  characters: Array<{ id: string; name: string; level: number; createdAt: string; bannedUntil: string | null; blockedUntil: string | null; clan: { id: string; name: string } | null }>;
  total: number;
  page: number;
  limit: number;
}> {
  const q = new URLSearchParams();
  if (params?.name) q.set("name", params.name);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const res = await fetch(`${API_URL}/admin/players${q.toString() ? `?${q}` : ""}`, { method: "GET", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: онлайн персонажі */
export async function adminGetOnlinePlayers(): Promise<{
  ok: boolean;
  characters: Array<{ id: string; name: string; level: number; lastActivityAt: string | null; clan: string | null; clanId?: string | null }>;
}> {
  const res = await fetch(`${API_URL}/admin/players/online`, { method: "GET", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: відправити системний лист */
export async function adminSendLetter(params: { toCharacterId?: string; toCharacterName?: string; subject?: string; message: string }): Promise<{ ok: boolean; letterId?: string }> {
  const res = await fetch(`${API_URL}/admin/letters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: розіслати лист від Existence всім гравцям */
export async function adminBroadcastLetter(params: { subject?: string; message: string }): Promise<{ ok: boolean; sent: number; total: number }> {
  const res = await fetch(`${API_URL}/admin/letters/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: листи персонажа */
export async function adminGetPlayerLetters(characterId: string, page?: number, limit?: number): Promise<{
  ok: boolean;
  letters: any[];
  total: number;
  page: number;
  limit: number;
}> {
  const q = new URLSearchParams();
  if (page != null) q.set("page", String(page));
  if (limit != null) q.set("limit", String(limit));
  const res = await fetch(`${API_URL}/admin/player/${encodeURIComponent(characterId)}/letters${q.toString() ? `?${q}` : ""}`, { method: "GET", credentials: "include", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: список кланів */
export async function adminGetClans(): Promise<{ ok: boolean; clans: any[] }> {
  const res = await fetch(`${API_URL}/admin/clans`, { method: "GET", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}

/** Адмін: розпустити клан */
export async function adminDisbandClan(clanId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/clans/${encodeURIComponent(clanId)}/disband`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: вигнати гравця з клану */
export async function adminKickFromClan(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/admin/clans/${encodeURIComponent(clanId)}/members/${encodeURIComponent(characterId)}/kick`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return { ok: true };
}

/** Адмін: Seven Seals — розіслати листи топ-3 */
export async function adminSevenSealsSendMail(): Promise<{
  ok: boolean;
  finalized?: boolean;
  weekKey?: string;
  top3?: number;
  skipped?: string;
}> {
  const res = await fetch(`${API_URL}/admin/seven-seals/send-mail`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}
