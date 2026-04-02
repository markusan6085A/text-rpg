import { apiRequest } from "./core";
import type { Character } from "./typesAuthCharacter";

// --- Онлайн-ринок між гравцями (лот 24 год) ---
export type MarketCurrency = "adena" | "coinLuck";

export interface MarketListingDTO {
  id: string;
  sellerCharacterId: string;
  sellerName: string;
  itemSnapshot: unknown;
  currency: MarketCurrency;
  /** BigInt у БД — з API як рядок; number лишається для сумісності зі старими відповідями */
  price: string | number;
  createdAt: string;
  expiresAt: string;
}

export type MarketListingsKindFilter = "all" | "items" | "coin_luck";

export async function fetchMarketListings(
  page = 1,
  limit = 20,
  kind?: MarketListingsKindFilter
): Promise<{ ok: boolean; listings: MarketListingDTO[]; total: number; page: number; limit: number }> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (kind && kind !== "all") q.set("kind", kind);
  return apiRequest(`/market/listings?${q.toString()}`, { method: "GET" });
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
    inventoryItemId?: string;
    /** Валюта з балансу героя (не інвентар); ціна лише в адені */
    listingKind?: "coin_luck";
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
  buyerCharacterId: string,
  quantity?: number
): Promise<{ ok: boolean; buyer: Character; seller: Character }> {
  const body: { buyerCharacterId: string; quantity?: number } = { buyerCharacterId };
  if (quantity != null && Number.isFinite(quantity) && quantity >= 1) {
    body.quantity = Math.floor(quantity);
  }
  return apiRequest(`/market/listings/${encodeURIComponent(listingId)}/buy`, {
    method: "POST",
    body: JSON.stringify(body),
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
