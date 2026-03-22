// API client for backend communication
// У production на l2dop.com запити йдуть через /api → Vercel rewrite на api.l2dop.com
export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.MODE === "production" ? "/api" : "http://localhost:3000");

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__API_URL__ = API_URL;
  (window as any).__VITE_API_URL__ = import.meta.env.VITE_API_URL || 'NOT SET';
}

export interface ApiError {
  error: string;
}

// Auth API
export interface RegisterRequest {
  login: string;
  password: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  accessToken: string;
}

// Character API
export interface Character {
  id: string;
  name: string;
  race: string;
  classId: string;
  sex: string;
  level: number;
  exp: number;
  sp: number;
  adena: number;
  aa: number;
  coinLuck: number;
  coinsSilver?: number;
  heroJson: any;
  bannedUntil?: string | null;
  blockedUntil?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastActivityAt?: string; // 🔥 Для показу "Останній раз був"
  clan?: {
    id: string;
    name: string;
    emblem: string | null;
  } | null;
}

export interface CreateCharacterRequest {
  name: string;
  race: string;
  classId: string;
  sex: string;
}

export interface UpdateCharacterRequest {
  heroJson?: any;
  level?: number;
  exp?: number;
  sp?: number;
  adena?: number;
  aa?: number;
  coinLuck?: number;
  coinsSilver?: number;
  expectedRevision?: number; // Для optimistic locking
}

export interface CharactersResponse {
  ok: boolean;
  characters: Character[];
}

export interface CharacterResponse {
  ok: boolean;
  character: Character;
}

import { useAuthStore } from "../state/authStore";

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/** Результат refresh: успіх з токеном, auth failure (401/403), або мережева помилка. */
type RefreshResult = { token: string } | { authFailure: true } | { authFailure: false };

async function refreshAccessToken(): Promise<RefreshResult> {
  const REFRESH_TIMEOUT_MS = 8000; // При поганому інтернеті не зависати
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data?.accessToken) {
        useAuthStore.getState().setAccessToken(data.accessToken);
        return { token: data.accessToken };
      }
    }
    // Сервер повернув 401/403 — токен дійсно протух
    const isAuthFailure = res.status === 401 || res.status === 403;
    return { authFailure: isAuthFailure };
  } catch {
    clearTimeout(t);
    // Мережева помилка, таймаут, AbortError — не викидати з гри
    return { authFailure: false };
  }
}

/** Options for apiRequest; _retry is internal to prevent infinite refresh loop. */
type ApiRequestOptions = RequestInit & { _retry?: boolean };

async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { _retry, ...fetchOptions } = options;
  const headers: HeadersInit = {
    ...(fetchOptions.headers || {}),
  };

  if (fetchOptions.method === "DELETE") {
    delete (headers as Record<string, string>)["Content-Type"];
    delete (headers as Record<string, string>)["content-type"];
  } else {
    if (!(headers as Record<string, string>)["Content-Type"]) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }
  }

  const doFetch = async (token: string | null) => {
    const h = { ...headers };
    if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers: h,
      credentials: "include",
    });
  };

  let token = getAccessToken();
  let response = await doFetch(token);

  const isAuthEndpoint =
    endpoint.startsWith("/auth/") || endpoint.startsWith("/admin/auth/");
  let retried = !!_retry;
  if (response.status === 401 && !retried && !isAuthEndpoint) {
    retried = true;
    const refreshResult = await refreshAccessToken();
    if ("token" in refreshResult) {
      response = await doFetch(refreshResult.token);
    } else {
      // Викидаємо з гри тільки при реальному auth failure (токен протух). При мережевій помилці — ні.
      if (refreshResult.authFailure) {
        useAuthStore.getState().logout();
      }
      const error: ApiError = await response.json().catch(() => ({ error: "unauthorized" }));
      const err = new Error(error.error || "unauthorized") as any;
      err.status = 401;
      err.unauthorized = true;
      throw err;
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    const error: ApiError = errorBody as ApiError;
    const errorWithStatus = new Error(error.error || `HTTP ${response.status}`) as any;
    errorWithStatus.status = response.status;
    errorWithStatus.details = (errorBody as any).details || (errorBody as any).errors;
    errorWithStatus.body = errorBody;

    if (response.status === 401 || response.status === 403) {
      useAuthStore.getState().logout();
      // ❗ Не скидаємо admin — apiRequest тільки для game API; admin використовує cookies окремо
      errorWithStatus.unauthorized = true;
      throw errorWithStatus;
    }

    if (response.status === 429) {
      const retryAfter = Number((error as any).retryAfter);
      const sec = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
      try {
        const mod = await import("../state/heroStore");
        mod.setRateLimitCooldown(sec * 1000);
      } catch (_) {}
      errorWithStatus.retryAfter = sec;
      errorWithStatus.message = `Забагато запитів. Зачекайте ${sec} сек.`;
      try {
        const { showToast } = await import("../state/toastStore");
        showToast(errorWithStatus.message, "info");
      } catch (_) {}
    }
    throw errorWithStatus;
  }

  return response.json();
}

// Auth API functions (credentials: "include" is in apiRequest)
export async function register(login: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  return response.accessToken;
}

export async function login(login: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  return response.accessToken;
}

// Character API functions
export async function listCharacters(): Promise<Character[]> {
  const response = await apiRequest<CharactersResponse>('/characters', {
    method: 'GET',
  });
  return response.characters;
}

export async function getCharacter(id: string): Promise<Character> {
  if (import.meta.env.DEV) {
    console.log('GET character called', new Error().stack);
  }
  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'GET',
  });
  return response.character;
}

export async function getPublicCharacter(id: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/public/${id}`, {
    method: 'GET',
  });
  const char = response?.character;
  if (!char?.id) throw new Error("Персонаж не знайдено");
  return char;
}

export async function getCharacterByName(name: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/by-name/${encodeURIComponent(name)}`, {
    method: 'GET',
  });
  return response.character;
}

export async function createCharacter(data: CreateCharacterRequest): Promise<Character> {
  const response = await apiRequest<CharacterResponse>('/characters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.character;
}

/** top-level exp/level не шлемо — колонки в БД можуть лишатися старими; прогрес у heroJson. SP шлемо — інакше Character.sp не оновлюється після мобів і після F5 відкат. */
export async function updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
  const cleanData = { ...data };
  delete cleanData.exp;
  delete cleanData.level;

  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanData),
  });
  return response.character;
}

/** Оновити тільки inventory/overflowChest (без exp/level — щоб куплені предмети зберігались при 400) */
export async function updateInventoryAPI(characterId: string, data: { inventory?: any[]; overflowChest?: any[] }): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${encodeURIComponent(characterId)}/inventory`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.character;
}

/** Очистити інвентар на сервері (окремий ендпоінт — без exp/level, уникаємо "exp cannot be decreased") */
export async function clearInventoryAPI(characterId: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${encodeURIComponent(characterId)}/inventory/clear`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
  return response.character;
}

// --- Онлайн-ринок між гравцями (лот 24 год) ---
export type MarketCurrency = "adena" | "coinLuck";

export interface MarketListingDTO {
  id: string;
  sellerCharacterId: string;
  sellerName: string;
  itemSnapshot: unknown;
  currency: MarketCurrency;
  price: number;
  createdAt: string;
  expiresAt: string;
}

export async function fetchMarketListings(
  page = 1,
  limit = 20
): Promise<{ ok: boolean; listings: MarketListingDTO[]; total: number; page: number; limit: number }> {
  return apiRequest(`/market/listings?page=${page}&limit=${limit}`, { method: "GET" });
}

export async function fetchMyMarketListings(
  characterId: string
): Promise<{ ok: boolean; listings: MarketListingDTO[] }> {
  return apiRequest(
    `/market/my-listings?characterId=${encodeURIComponent(characterId)}`,
    { method: "GET" }
  );
}

export async function createMarketListingApi(
  characterId: string,
  payload: {
    inventoryItemId: string;
    currency: MarketCurrency;
    /** Ціна за 1 шт.; покупець платить unitPrice * amount */
    unitPrice: number;
    /** Скільки шт. у лоті (стек) */
    amount: number;
    /** Точний слот: основний інвентар або переповнення (риба/ресурси тощо) */
    itemSource?: "inventory" | "overflowChest";
    itemIndex?: number;
  }
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest(`/market/listings`, {
    method: "POST",
    body: JSON.stringify({ characterId, ...payload }),
  });
}

export async function buyMarketListingApi(
  listingId: string,
  buyerCharacterId: string
): Promise<{ ok: boolean; buyer: Character; seller: Character }> {
  return apiRequest(`/market/listings/${encodeURIComponent(listingId)}/buy`, {
    method: "POST",
    body: JSON.stringify({ buyerCharacterId }),
  });
}

export async function cancelMarketListingApi(
  listingId: string,
  characterId: string
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest(
    `/market/listings/${encodeURIComponent(listingId)}?characterId=${encodeURIComponent(characterId)}`,
    { method: "DELETE" }
  );
}

/** Сплатити 1M аден для перегляду характеристик іншого гравця */
export async function payToViewPlayerStats(targetCharacterId: string): Promise<{ ok: boolean; newAdena: number }> {
  const response = await apiRequest<{ ok: boolean; newAdena: number }>(
    `/characters/${targetCharacterId}/pay-view-stats`,
    { method: "POST", body: JSON.stringify({}) }
  );
  return response;
}

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
  prefersMagic: boolean;
  skills: PkSessionSkill[];
}

export interface PkSessionState {
  id: string;
  attackerId: string;
  defenderId: string;
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
  options?: { isBuff?: boolean; isToggle?: boolean; name?: string; target?: string; shotMultiplier?: number; shotName?: string; buffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>; buffCooldownMs?: number; buffDurationSec?: number }
): Promise<PkSessionResponse> {
  return apiRequest<PkSessionResponse>(`/characters/pk/session/${encodeURIComponent(sessionId)}/act`, {
    method: "POST",
    body: JSON.stringify({ skillId, ...options }),
  });
}

export async function getPkState(characterId: string): Promise<PkStateResponse> {
  return apiRequest<PkStateResponse>(`/characters/${encodeURIComponent(characterId)}/pk/state`, {
    method: "GET",
  });
}

/** Resurrect: сервер атомарно скидає isDead/deadAt, ставить hp/mp/cp на max, heroBuffs=[]. Повертає оновленого character. */
export async function resurrectCharacter(id: string, ratio?: number): Promise<Character> {
  const body = ratio != null && ratio < 1 ? { ratio } : {};
  const response = await apiRequest<CharacterResponse>(`/characters/${id}/resurrect`, {
    method: 'POST',
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  return response.character;
}

// Fishing API (session on server, one per account)
export interface FishingSession {
  startedAt: number;
  fishCount?: number;
}

export interface FishingSessionResponse {
  ok: boolean;
  session: FishingSession | null;
  serverNow: number;
}

export interface FishingStartResponse {
  ok: boolean;
  character: Character;
  session: { startedAt: number; fishCount?: number };
  serverNow: number;
}

export interface FishingCollectResponse {
  ok: boolean;
  character: Character;
  fishCount: number;
  expGained?: number;
}

export async function getFishingSession(characterId: string): Promise<FishingSessionResponse> {
  const response = await apiRequest<FishingSessionResponse>(`/characters/${characterId}/fishing`, {
    method: 'GET',
  });
  return response;
}

export async function startFishing(characterId: string): Promise<FishingStartResponse> {
  return apiRequest<FishingStartResponse>(`/characters/${characterId}/fishing/start`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function collectFishing(characterId: string): Promise<FishingCollectResponse> {
  return apiRequest<FishingCollectResponse>(`/characters/${characterId}/fishing/collect`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export interface FishDismantleResponse {
  ok: boolean;
  character: { id: string; adena?: number; heroJson: any; [k: string]: unknown };
  dropResult: {
    adena: number;
    coinOfLuck: number;
    coinsSilver: number;
    weapons: Array<{ id: string; count: number }>;
    armorPieces: Array<{ id: string; count: number }>;
    jewelryPieces: Array<{ id: string; count: number }>;
    resources: Array<{ id: string; count: number }>;
    enchantScrolls: Array<{ id: string; count: number }>;
  };
}

export async function dismantleFish(
  characterId: string,
  itemId: string,
  amount: number
): Promise<FishDismantleResponse> {
  return apiRequest<FishDismantleResponse>(`/characters/${characterId}/fish/dismantle`, {
    method: 'POST',
    body: JSON.stringify({ itemId, amount }),
  });
}

export type PremiumPack = "3h" | "7h" | "12h" | "24h";

export interface BuyPremiumResponse {
  ok: boolean;
  character: {
    id: string;
    coinLuck: number;
    heroJson: any;
    name?: string;
    level?: number;
    exp?: number;
    sp?: number;
    adena?: number;
    aa?: number;
    updatedAt?: string;
  };
}

export async function buyPremium(
  characterId: string,
  pack: PremiumPack,
  expectedRevision?: number
): Promise<BuyPremiumResponse> {
  const response = await apiRequest<BuyPremiumResponse>("/premium/buy", {
    method: "POST",
    body: JSON.stringify({ characterId, pack, expectedRevision }),
  });
  return response;
}

export interface ColorizeNickResponse {
  ok: boolean;
  character: {
    id: string;
    coinLuck: number;
    nickColor: string | null;
    heroJson: any;
    name?: string;
    level?: number;
    exp?: number;
    sp?: number;
    adena?: number;
    aa?: number;
    updatedAt?: string;
  };
}

export async function colorizeNick(
  characterId: string,
  nickColor: string,
  expectedRevision?: number
): Promise<ColorizeNickResponse> {
  const response = await apiRequest<ColorizeNickResponse>(
    `/characters/${characterId}/colorize-nick`,
    {
      method: "POST",
      body: JSON.stringify({ nickColor, expectedRevision }),
    }
  );
  return response;
}

export interface RenameNickResponse {
  ok: boolean;
  character: {
    id: string;
    coinLuck: number;
    name: string;
    heroJson: any;
    level?: number;
    exp?: number;
    sp?: number;
    adena?: number;
    aa?: number;
    updatedAt?: string;
  };
}

export async function renameNick(
  characterId: string,
  name: string,
  expectedRevision?: number
): Promise<RenameNickResponse> {
  const response = await apiRequest<RenameNickResponse>(
    `/characters/${characterId}/rename-nick`,
    {
      method: "POST",
      body: JSON.stringify({ name, expectedRevision }),
    }
  );
  return response;
}

// Chat API
export interface ChatMessage {
  id: string;
  characterName: string;
  characterId?: string; // For ownership check
  channel: string;
  message: string;
  createdAt: string;
  isOwn?: boolean; // Whether this message belongs to current user
  nickColor?: string; // Color of the character's nickname
  emblem?: string | null; // Clan emblem of the sender
}

export interface ChatMessagesResponse {
  ok: boolean;
  messages: ChatMessage[];
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PostChatMessageRequest {
  channel: string;
  message: string;
}

export interface PostChatMessageResponse {
  ok: boolean;
  message: ChatMessage;
}

export interface ChatRestrictionResponse {
  ok: boolean;
  mutedUntil: number | null;
  bannedUntil: string | null;
  isMuted: boolean;
  isBanned: boolean;
}

export async function getChatRestriction(): Promise<ChatRestrictionResponse> {
  const response = await apiRequest<ChatRestrictionResponse>('/chat/restriction', { method: 'GET' });
  return response;
}

export async function getChatMessages(channel: string = 'general', page: number = 1, limit: number = 10): Promise<ChatMessagesResponse> {
  const response = await apiRequest<ChatMessagesResponse>(`/chat/messages?channel=${encodeURIComponent(channel)}&page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function deleteChatMessage(messageId: string): Promise<{ ok: boolean; message: string }> {
  // 🔥 DELETE не повинен мати body, тільки URL параметр
  console.log('[api] deleteChatMessage called:', messageId);
  try {
    // 🔥 Використовуємо fetch напряму для DELETE, щоб гарантовано не додати Content-Type
    const token = getAccessToken();
    const headers: HeadersInit = { Accept: "application/json" };
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/chat/messages/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    console.log('[api] DELETE response status:', response.status, response.statusText);
    console.log('[api] DELETE response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Спробуємо отримати детальну помилку з бекенду
      const status = response.status;
      let errorMessage = `HTTP ${status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('[api] DELETE error response:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.details) {
          console.error('[api] DELETE error details:', errorData.details);
          errorMessage += ` (${JSON.stringify(errorData.details)})`;
        }
      } catch (e) {
        // Не вдалося розпарсити JSON - використовуємо текст
        const text = await response.text().catch(() => '');
        console.error('[api] DELETE error text:', text);
        errorMessage = text || errorMessage;
      }
      
      // 🔥 Додаємо status до помилки для перевірки на фронтенді
      const error = new Error(errorMessage) as any;
      error.status = status;
      throw error;
    }

    const result = await response.json() as { ok: boolean; message: string };
    console.log('[api] deleteChatMessage success:', result);
    return result;
  } catch (error: any) {
    console.error('[api] deleteChatMessage error:', error);
    console.error('[api] deleteChatMessage error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    throw error;
  }
}

export async function postChatMessage(channel: string, message: string): Promise<ChatMessage> {
  const response = await apiRequest<PostChatMessageResponse>('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ channel, message }),
  });
  return response.message;
}

// Online players API
export interface OnlinePlayer {
  id: string;
  name: string;
  level: number;
  location: string;
  power?: number;
  lastActivityAt: string;
  nickColor?: string; // Color of the player's nickname
  emblem?: string; // Clan emblem
}

export interface OnlinePlayersResponse {
  ok: boolean;
  players: OnlinePlayer[];
  count: number;
}

export async function getOnlinePlayers(): Promise<OnlinePlayersResponse> {
  const response = await apiRequest<OnlinePlayersResponse>('/characters/online', {
    method: 'GET',
  });
  return response;
}

export async function sendHeartbeat(characterId?: string, location?: string): Promise<{ ok: boolean; message: string }> {
  const response = await apiRequest<{ ok: boolean; message: string }>('/characters/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ ts: Date.now(), characterId, location }),
  });
  return response;
}

// Letters API
export interface Letter {
  id: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  isOwn?: boolean; // Чи це наш відправлений лист
  fromCharacter: {
    id: string;
    name: string;
    nickColor?: string; // Color of the sender's nickname
    emblem?: string | null; // Clan emblem of the sender
  };
  toCharacter?: {
    id: string;
    name: string;
  };
}

export interface LettersResponse {
  ok: boolean;
  letters: Letter[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface LetterResponse {
  ok: boolean;
  letter: Letter;
}

export interface SendLetterRequest {
  toCharacterId?: string;
  toCharacterName?: string;
  subject?: string;
  message: string;
}

export async function sendLetter(request: SendLetterRequest): Promise<Letter> {
  const response = await apiRequest<LetterResponse>('/letters', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.letter;
}

export interface SendItemTransferRequest {
  toCharacterName: string;
  itemPayload: string;
}

export interface CharacterTransferSnapshot {
  id: string;
  name: string;
  race: string;
  classId: string;
  sex: string;
  level: number;
  exp: number;
  sp: number;
  adena: number;
  aa: number;
  coinLuck: number;
  coinsSilver?: number;
  heroJson: any;
  updatedAt?: string;
}

export interface ItemTransferLetterResponse {
  ok: boolean;
  letter: Letter;
  character?: CharacterTransferSnapshot;
}

export interface CollectItemFromLetterResponse {
  ok: boolean;
  character: CharacterTransferSnapshot;
  item: any;
}

export async function sendItemTransferLetter(request: SendItemTransferRequest): Promise<ItemTransferLetterResponse> {
  const response = await apiRequest<ItemTransferLetterResponse>('/letters/transfer', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response;
}

export async function collectItemFromLetter(letterId: string): Promise<CollectItemFromLetterResponse> {
  return apiRequest<CollectItemFromLetterResponse>(`/letters/${encodeURIComponent(letterId)}/collect-item`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getLetters(page: number = 1, limit: number = 50, characterId?: string): Promise<LettersResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (characterId) params.set("characterId", characterId);
  const response = await apiRequest<LettersResponse>(`/letters?${params}`, {
    method: 'GET',
  });
  return response;
}

export async function getLetter(id: string): Promise<Letter> {
  const response = await apiRequest<LetterResponse>(`/letters/${id}`, {
    method: 'GET',
  });
  return response.letter;
}

export async function deleteLetter(id: string): Promise<{ ok: boolean; message: string }> {
  const response = await apiRequest<{ ok: boolean; message: string }>(`/letters/${id}`, {
    method: 'DELETE',
  });
  return response;
}

export async function getConversationLetters(playerId: string, page: number = 1, limit: number = 10): Promise<{ ok: boolean; letters: Letter[]; total: number; page: number; limit: number }> {
  const response = await apiRequest<{ ok: boolean; letters: Letter[]; total: number; page: number; limit: number }>(`/letters/conversation/${playerId}?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function getUnreadCount(): Promise<{ ok: boolean; unreadCount: number }> {
  const response = await apiRequest<{ ok: boolean; unreadCount: number }>('/letters/unread-count', {
    method: 'GET',
  });
  return response;
}

// News API
export interface NewsItem {
  id: string;
  type: "new_player" | "premium_purchase" | "raid_boss_kill" | "return_to_world" | "broadcast";
  characterId?: string;
  characterName?: string;
  emblem?: string; // Clan emblem
  metadata: {
    hours?: number;
    bossName?: string;
    bossLevel?: number;
    bossDrops?: any[];
    actualDroppedItems?: Array<{ id: string; name: string; count: number }>;
    hoursAbsent?: number;
    subject?: string;
    messagePreview?: string;
  };
  createdAt: string;
}

export interface NewsResponse {
  ok: boolean;
  news: NewsItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function getNews(params?: { page?: number; limit?: number }): Promise<NewsResponse> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const query = q.toString();
  const response = await apiRequest<NewsResponse>(`/news${query ? `?${query}` : ""}`, {
    method: "GET",
  });
  return response;
}

export async function reportRaidBossKill(params: {
  characterId: string;
  characterName?: string;
  bossName: string;
  bossLevel?: number;
  bossDrops?: any[];
  actualDroppedItems?: Array<{ id: string; name: string; count: number }>;
}): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>('/news/raid-boss-kill', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response;
}

// Forum API
export async function getForumCategories(): Promise<{ ok: boolean; categories: any[] }> {
  return apiRequest<{ ok: boolean; categories: any[] }>('/forum/categories', { method: 'GET' });
}

export async function getForumTopics(categoryId: string, page = 1, limit = 20): Promise<{
  ok: boolean; topics: any[]; total: number; page: number; limit: number;
}> {
  return apiRequest(`/forum/categories/${encodeURIComponent(categoryId)}/topics?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function getForumTopic(topicId: string, page = 1, limit = 15): Promise<{
  ok: boolean; topic: any; posts: any[]; total: number; page: number; limit: number;
}> {
  return apiRequest(`/forum/topics/${encodeURIComponent(topicId)}?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function createForumTopic(params: {
  categoryId: string;
  title: string;
  message: string;
  characterId: string;
}): Promise<{ ok: boolean; topic: any }> {
  return apiRequest('/forum/topics', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createForumPost(params: {
  topicId: string;
  message: string;
  characterId: string;
}): Promise<{ ok: boolean; post: any }> {
  return apiRequest('/forum/posts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteForumTopic(topicId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/forum/topics/${encodeURIComponent(topicId)}?characterId=${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
  });
}

export async function deleteForumPost(postId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/forum/posts/${encodeURIComponent(postId)}?characterId=${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
  });
}

export async function updateForumPost(
  postId: string,
  characterId: string,
  message: string
): Promise<{ ok: boolean; post: { id: string; message: string; createdAt: string; character?: { id: string; name: string; nickColor?: string } } }> {
  return apiRequest(`/forum/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ characterId, message }),
  });
}

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
  rank: number | null;
  medalCount: number;
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
      return { ok: false, rank: null, medalCount: 0 };
    }
    throw err;
  }
}

export async function claimSevenSealsReward(characterId: string): Promise<{
  ok: boolean;
  alreadyClaimed?: boolean;
  bonus?: { pAtk: number; mAtk: number; pDef: number; mDef: number; rank: number };
}> {
  const response = await apiRequest<any>(`/seven-seals/claim`, {
    method: 'POST',
    body: JSON.stringify({ characterId }),
  });
  return response;
}

// Player Admin API
export async function healPlayer(characterId: string, skillId: number, power: number): Promise<{ ok: boolean; healedHp?: number; currentHp?: number }> {
  const response = await apiRequest<{ ok: boolean; healedHp?: number; currentHp?: number }>(`/characters/${characterId}/heal`, {
    method: 'POST',
    body: JSON.stringify({ skillId, power }),
  });
  return response;
}

export async function buffPlayer(characterId: string, skillId: number, buffData: any): Promise<{ ok: boolean; message?: string }> {
  const response = await apiRequest<{ ok: boolean; message?: string }>(`/characters/${characterId}/buff`, {
    method: 'POST',
    body: JSON.stringify({ skillId, buffData }),
  });
  return response;
}

// Clan API
export interface Clan {
  id: string;
  name: string;
  level: number;
  reputation: number;
  adena: number;
  coinLuck: number;
  emblem: string | null;
  announcement?: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  members?: ClanMember[];
  isLeader?: boolean;
  isMember?: boolean;
  memberCount?: number;
}

export interface ClanInvite {
  id: string;
  clanId: string;
  clanName: string;
  clanLevel: number;
  clanEmblem: string | null;
  invitedBy: string;
  createdAt: string;
}

export interface ClanApplication {
  id: string;
  clanId: string;
  clanName: string;
  clanLevel: number;
  clanEmblem: string | null;
  characterId?: string;
  characterName?: string;
  characterLevel?: number;
  createdAt: string;
}

export interface ClanMember {
  id: string;
  characterId: string;
  characterName: string;
  characterLevel?: number;
  title: string | null;
  isDeputy: boolean;
  isLeader?: boolean;
  joinedAt: string;
  isOnline: boolean;
}

export interface ClanChatMessage {
  id: string;
  characterId: string;
  characterName: string;
  nickColor: string | null;
  emblem: string | null;
  message: string;
  createdAt: string;
}

export interface ClanLog {
  id: string;
  type: string;
  characterId: string | null;
  characterName: string | null;
  targetCharacterId: string | null;
  message: string;
  metadata: any;
  createdAt: string;
}

export interface ClansResponse {
  ok: boolean;
  clans: Array<{
    id: string;
    name: string;
    level: number;
    reputation: number;
    adena: number;
    coinLuck: number;
    emblem: string | null;
    createdAt: string;
    _count: { members: number };
  }>;
}

export interface MyClanResponse {
  ok: boolean;
  clan: Clan | null;
}

export interface ClanChatResponse {
  ok: boolean;
  messages: ClanChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClanLogsResponse {
  ok: boolean;
  logs: ClanLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClanMembersResponse {
  ok: boolean;
  members: ClanMember[];
  isLeader: boolean;
}

export async function listClans(): Promise<ClansResponse> {
  const response = await apiRequest<ClansResponse>('/clans', {
    method: 'GET',
  });
  return response;
}

export async function getMyClan(): Promise<MyClanResponse> {
  const response = await apiRequest<MyClanResponse>('/clans/my', {
    method: 'GET',
  });
  return response;
}

export async function getClan(id: string): Promise<{ ok: boolean; clan: Clan }> {
  const response = await apiRequest<{ ok: boolean; clan: Clan }>(`/clans/${id}`, {
    method: 'GET',
  });
  return response;
}

export async function createClan(name: string, characterId?: string): Promise<{ ok: boolean; clan: Clan }> {
  const body: { name: string; characterId?: string } = { name };
  if (characterId) body.characterId = characterId;
  const response = await apiRequest<{ ok: boolean; clan: Clan }>('/clans', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response;
}

export async function deleteClan(id: string): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${id}`, {
    method: 'DELETE',
  });
  return response;
}

export async function getClanChat(clanId: string, page: number = 1, limit: number = 50): Promise<ClanChatResponse> {
  const response = await apiRequest<ClanChatResponse>(`/clans/${clanId}/chat?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function postClanChatMessage(clanId: string, message: string): Promise<{ ok: boolean; message: ClanChatMessage }> {
  const response = await apiRequest<{ ok: boolean; message: ClanChatMessage }>(`/clans/${clanId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return response;
}

export async function getClanLogs(clanId: string, page: number = 1, limit: number = 50): Promise<ClanLogsResponse> {
  const response = await apiRequest<ClanLogsResponse>(`/clans/${clanId}/logs?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function getClanMembers(clanId: string): Promise<ClanMembersResponse> {
  const response = await apiRequest<ClanMembersResponse>(`/clans/${clanId}/members`, {
    method: 'GET',
  });
  return response;
}

export async function kickClanMember(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/members/${characterId}/kick`, {
    method: 'POST',
  });
  return response;
}

export async function changeClanMemberTitle(clanId: string, characterId: string, title: string | null): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/members/${characterId}/title`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return response;
}

export async function setClanMemberDeputy(clanId: string, characterId: string, isDeputy: boolean): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/members/${characterId}/deputy`, {
    method: 'POST',
    body: JSON.stringify({ isDeputy }),
  });
  return response;
}

export interface ClanWarehouseItem {
  id: string;
  itemId: string;
  qty: number;
  meta: any;
  depositedBy: string | null;
  depositedAt: string;
}

export interface ClanWarehouseResponse {
  ok: boolean;
  items: ClanWarehouseItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getClanWarehouse(clanId: string, page: number = 1, limit: number = 10): Promise<ClanWarehouseResponse> {
  const response = await apiRequest<ClanWarehouseResponse>(`/clans/${clanId}/warehouse?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function depositClanWarehouseItem(clanId: string, itemId: string, qty: number = 1, meta: any = {}): Promise<{ ok: boolean; item: ClanWarehouseItem }> {
  const response = await apiRequest<{ ok: boolean; item: ClanWarehouseItem }>(`/clans/${clanId}/warehouse/deposit`, {
    method: 'POST',
    body: JSON.stringify({ itemId, qty, meta }),
  });
  return response;
}

export async function withdrawClanWarehouseItem(clanId: string, itemId: string): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/warehouse/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  });
  return response;
}

export async function depositClanAdena(clanId: string, amount: number): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/adena/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response;
}

export async function withdrawClanAdena(clanId: string, amount: number): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/adena/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response;
}

export async function depositClanCoinLuck(clanId: string, amount: number): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/coin-luck/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response;
}

export async function withdrawClanCoinLuck(clanId: string, amount: number): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/coin-luck/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response;
}

export async function setClanEmblem(clanId: string, emblem: string): Promise<{ ok: boolean; clan: Clan }> {
  const response = await apiRequest<{ ok: boolean; clan: Clan }>(`/clans/${clanId}/emblem`, {
    method: 'POST',
    body: JSON.stringify({ emblem }),
  });
  return response;
}

// Invite / Apply / Leave / Transfer
export async function getClanInvites(): Promise<{ ok: boolean; invites: ClanInvite[] }> {
  return apiRequest<{ ok: boolean; invites: ClanInvite[] }>('/clans/invites/mine', { method: 'GET' });
}

export async function respondClanInvite(inviteId: string, accept: boolean): Promise<{ ok: boolean; accepted: boolean }> {
  return apiRequest<{ ok: boolean; accepted: boolean }>(`/clans/invites/${inviteId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function inviteToClan(clanId: string, characterId: string): Promise<{ ok: boolean; invite?: { id: string } }> {
  return apiRequest<{ ok: boolean; invite?: { id: string } }>(`/clans/${clanId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ characterId }),
  });
}

export async function applyToClan(clanId: string): Promise<{ ok: boolean; application?: { id: string } }> {
  return apiRequest<{ ok: boolean; application?: { id: string } }>(`/clans/${clanId}/apply`, {
    method: 'POST',
  });
}

export async function getClanApplications(): Promise<{ ok: boolean; applications: ClanApplication[] }> {
  return apiRequest<{ ok: boolean; applications: ClanApplication[] }>(`/clans/applications/mine`, { method: 'GET' });
}

export async function getClanApplicationsList(clanId: string): Promise<{ ok: boolean; applications: ClanApplication[] }> {
  return apiRequest<{ ok: boolean; applications: ClanApplication[] }>(`/clans/${clanId}/applications`, { method: 'GET' });
}

export async function acceptClanApplication(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/applications/${characterId}/accept`, { method: 'POST' });
}

export async function declineClanApplication(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/applications/${characterId}/decline`, { method: 'POST' });
}

export async function leaveClan(clanId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/leave`, { method: 'POST' });
}

export async function transferClanLeadership(clanId: string, newLeaderCharacterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ characterId: newLeaderCharacterId }),
  });
}

export async function setClanAnnouncement(clanId: string, announcement: string): Promise<{ ok: boolean; announcement: string }> {
  return apiRequest<{ ok: boolean; announcement: string }>(`/clans/${clanId}/announcement`, {
    method: 'PATCH',
    body: JSON.stringify({ announcement }),
  });
}

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
export async function adminSevenSealsSendMail(): Promise<{ ok: boolean; sent?: number; skipped?: number }> {
  const res = await fetch(`${API_URL}/admin/seven-seals/send-mail`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as ApiError).error || "Forbidden");
  return data as any;
}