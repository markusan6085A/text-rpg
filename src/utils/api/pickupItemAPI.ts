// Клієнтський хелпер для серверного pickup-item
import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";

export interface PickupItemResult {
  ok: boolean;
  heroJson: any;
}

export interface PickupItemEntry {
  id: string;
  count?: number;
  name?: string;
  kind?: string;
  slot?: string;
  icon?: string;
  grade?: string;
  enchantLevel?: number;
  [key: string]: any;
}

/**
 * Атомарно додає предмети в інвентар через сервер.
 * Використовується: battle drops, нагороди квестів, пошта.
 * Сервер сам обробляє переповнення (overflowChest).
 */
export async function pickupItemAPI(params: {
  items: PickupItemEntry[];
  /** Джерело для логів: "battle", "quest", "mail", "craft" */
  source?: string;
  expectedRevision: number;
}): Promise<PickupItemResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<PickupItemResult>(`/characters/${characterId}/pickup-item`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
