import { apiRequest } from "./core";
import type { Character } from "./typesAuthCharacter";

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
