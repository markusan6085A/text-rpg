// API client for backend communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
function getToken(): string | null {
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
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
