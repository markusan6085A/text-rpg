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
