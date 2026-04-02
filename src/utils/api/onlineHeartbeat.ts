import { apiRequest } from "./core";

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
