import { apiRequest } from "./core";

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
