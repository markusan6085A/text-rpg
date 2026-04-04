// Клієнтський хелпер для атомарного збереження екіпу (Phase 2)
import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";

export interface EquipCommitResult {
  ok: boolean;
  heroJson: any;
}

/**
 * Клієнт обраховує новий стан екіпу локально (equipItemLogic / unequipItemLogic),
 * потім атомарно зберігає його через цей endpoint.
 * Сервер просто зберігає новий equipment/inventory/enchantLevels як транзакцію.
 */
export async function commitEquipStateAPI(params: {
  equipment: Record<string, any>;
  inventory: any[];
  equipmentEnchantLevels: Record<string, number>;
}): Promise<EquipCommitResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<EquipCommitResult>(`/characters/${characterId}/equip-commit`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
