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
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
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
    
    // 🔥 Явно НЕ додаємо Content-Type для DELETE
    const response = await fetch(`${API_URL}/chat/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers,
      // НЕ додаємо body
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json() as { ok: boolean; message: string };
    console.log('[api] deleteChatMessage success:', result);
    return result;
  } catch (error: any) {
    console.error('[api] deleteChatMessage error:', error);
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