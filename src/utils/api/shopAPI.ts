// Клієнтський хелпер для серверного GM-шопу (Phase 3)
import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";

export interface ShopBuyResult {
  ok: boolean;
  heroJson: any;
  adena: number;
  coinsSilver: number;
}

/**
 * Покупка предмета в GM-шопі через сервер.
 * Сервер перевіряє баланс і атомарно додає предмет в inventory.
 */
export async function shopBuyAPI(params: {
  itemId: string;
  quantity: number;
  shopType?: "gm" | "regular" | "quest";
  /** Метадані предмета для збереження в inventory (name, kind, slot, icon, etc.) */
  itemMeta?: Record<string, any>;
  expectedRevision?: number;
}): Promise<ShopBuyResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<ShopBuyResult>(`/characters/${characterId}/shop/buy`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
