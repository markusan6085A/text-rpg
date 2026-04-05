// Клієнтський хелпер для серверної заточки (Phase 1)
import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";
import type { Character } from "./typesAuthCharacter";

export interface EnchantResult {
  ok: boolean;
  success: boolean;
  newEnchantLevel: number;
  character: Character;
}

/**
 * Виконує заточку на сервері атомарно.
 * Сервер сам визначає результат (Math.random), зберігає в БД і повертає оновлений heroJson.
 */
export async function enchantItemAPI(params: {
  scrollId: string;
  /** Слот екіпірованого предмета (якщо точимо екіп) */
  slot?: string | null;
  /** Індекс рядка в inventory (якщо точимо з інвентаря) */
  inventoryItemIndex?: number | null;
  /** ID предмета для верифікації — сервер перевірить, що item[index].id збігається */
  targetItemId?: string | null;
  expectedRevision: number;
}): Promise<EnchantResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<EnchantResult>(`/characters/${characterId}/enchant`, {
    method: "POST",
    body: JSON.stringify({
      scrollId: params.scrollId,
      ...(params.slot != null ? { slot: params.slot } : {}),
      ...(params.inventoryItemIndex != null
        ? { inventoryItemIndex: params.inventoryItemIndex }
        : {}),
      ...(params.targetItemId != null ? { targetItemId: params.targetItemId } : {}),
      expectedRevision: params.expectedRevision,
    }),
  });
}
