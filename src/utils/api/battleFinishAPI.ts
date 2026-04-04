// Клієнтський хелпер для серверного battle-finish (Phase 5)
import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";

export interface BattleFinishResult {
  ok: boolean;
  heroJson: any;
}

export interface BattleFinishParams {
  mobId?: string;
  earnedExp?: number;
  earnedSp?: number;
  earnedAdena?: number;
  newLevel?: number;
  newExp?: number;
  newSp?: number;
  newAdena?: number;
  newHp?: number;
  newMp?: number;
  newCp?: number;
  /** Partial heroJson patch (inventory, overflowChest, dailyQuestsProgress, etc.) */
  heroJsonPatch?: Record<string, any>;
}

/**
 * Фіксує результат бою на сервері атомарно (Phase 5).
 * Сервер перевіряє базові ліміти і зберігає зміни.
 * Викликається паралельно з updateHero (оптимістичне оновлення).
 */
export async function battleFinishAPI(
  params: BattleFinishParams
): Promise<BattleFinishResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<BattleFinishResult>(`/characters/${characterId}/battle-finish`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
