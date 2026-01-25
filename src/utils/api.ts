// API client for backend communication
export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

// Логуємо API_URL при завантаженні (для відлагодження)
if (typeof window !== 'undefined') {
  console.log('[API] API_URL:', API_URL);
  console.log('[API] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'NOT SET (using localhost:3000)');
  // Додаємо глобальну змінну для перевірки в консолі
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
  token: string;
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
  heroJson: any;
  createdAt: string;
  updatedAt?: string;
  lastActivityAt?: string; // 🔥 Для показу "Останній раз був"
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

// Helper function to get auth token
export function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // 🔥 Для DELETE НЕ додаємо Content-Type (Fastify вимагає body, якщо є Content-Type: application/json)
  // 🔥 Явно видаляємо Content-Type для DELETE, якщо він був доданий раніше
  if (options.method === 'DELETE') {
    // Видаляємо Content-Type для DELETE (Fastify не очікує body)
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else {
    // Для інших методів додаємо Content-Type, якщо його немає
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // ❗ ВАЖЛИВО: Обробка 401 Unauthorized - токен невалідний або відсутній
      if (response.status === 401) {
        // Очищаємо токен, якщо він є (може бути невалідним)
        const currentToken = getToken();
        if (currentToken) {
          // Токен є, але невалідний - очищаємо його
          try {
            const { useAuthStore } = await import('../state/authStore');
            useAuthStore.getState().logout();
          } catch (e) {
            // Якщо не вдалося імпортувати store, просто очищаємо localStorage
            localStorage.removeItem('auth_token');
          }
        }
        
        // Створюємо помилку зі статусом
        const error: ApiError = await response.json().catch(() => ({
          error: 'unauthorized',
        }));
        const errorWithStatus = new Error(error.error || 'unauthorized') as any;
        errorWithStatus.status = 401;
        errorWithStatus.unauthorized = true;
        throw errorWithStatus;
      }
      
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      // 🔥 Додаємо status до помилки для обробки на клієнті
      const errorWithStatus = new Error(error.error || `HTTP ${response.status}`) as any;
      errorWithStatus.status = response.status;
      errorWithStatus.details = (error as any).details || (error as any).errors;
      throw errorWithStatus;
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend запущен на http://localhost:3000');
    }
    // Handle Prisma errors (table doesn't exist, etc.)
    if (error?.message?.includes('ChatMessage') || error?.message?.includes('does not exist')) {
      throw new Error('Таблица ChatMessage не создана в базе данных. Выполните SQL скрипт из server/create_chat_table.sql в Supabase SQL Editor.');
    }
    throw error;
  }
}

// Auth API functions
export async function register(login: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  return response.token;
}

export async function login(login: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  return response.token;
}

// Character API functions
export async function listCharacters(): Promise<Character[]> {
  const response = await apiRequest<CharactersResponse>('/characters', {
    method: 'GET',
  });
  return response.characters;
}

export async function getCharacter(id: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'GET',
  });
  return response.character;
}

export async function getPublicCharacter(id: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/public/${id}`, {
    method: 'GET',
  });
  return response.character;
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

export async function updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.character;
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
}

export interface ChatMessagesResponse {
  ok: boolean;
  messages: ChatMessage[];
  page: number;
  limit: number;
}

export interface PostChatMessageRequest {
  channel: string;
  message: string;
}

export interface PostChatMessageResponse {
  ok: boolean;
  message: ChatMessage;
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
    const token = getToken();
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_URL}/chat/messages/${encodeURIComponent(messageId)}`;
    console.log('[api] DELETE URL:', url);
    console.log('[api] DELETE headers:', headers);
    
    // 🔥 Явно НЕ додаємо Content-Type для DELETE
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      // НЕ додаємо body
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

export async function sendHeartbeat(): Promise<{ ok: boolean; message: string }> {
  const response = await apiRequest<{ ok: boolean; message: string }>('/characters/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ ts: Date.now() }),
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

export async function getLetters(page: number = 1, limit: number = 50): Promise<LettersResponse> {
  const response = await apiRequest<LettersResponse>(`/letters?page=${page}&limit=${limit}`, {
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
  type: "new_player" | "premium_purchase" | "raid_boss_kill";
  characterId?: string;
  characterName?: string;
  metadata: {
    hours?: number;
    bossName?: string;
    bossLevel?: number;
    bossDrops?: any[];
  };
  createdAt: string;
}

export interface NewsResponse {
  ok: boolean;
  news: NewsItem[];
}

export async function getNews(): Promise<NewsResponse> {
  const response = await apiRequest<NewsResponse>('/news', {
    method: 'GET',
  });
  return response;
}

export async function reportRaidBossKill(params: {
  characterId: string;
  characterName?: string;
  bossName: string;
  bossLevel?: number;
  bossDrops?: any[];
}): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>('/news/raid-boss-kill', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response;
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

export async function createClan(name: string): Promise<{ ok: boolean; clan: Clan }> {
  const response = await apiRequest<{ ok: boolean; clan: Clan }>('/clans', {
    method: 'POST',
    body: JSON.stringify({ name }),
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