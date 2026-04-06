// Клієнтський хелпер для серверного battle-finish (Phase 5)
import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";

export interface BattleFinishResult {
  ok: boolean;
  heroJson: any;
  /** Повний snapshot персонажа (паралельно до heroJson) — джерело правди для стора після kill. */
  character?: unknown;
  serverDrops?: {
    items: Array<{ id: string; count: number; name?: string }>;
    adena: number;
    messages: string[];
    questProgressUpdates?: Array<{ questId: string; itemId: string; count: number }>;
    zaricheEquipped?: boolean;
    zaricheEquippedUntil?: number;
  };
}

export interface BattleFinishParams {
  mobId?: string;
  /** Idempotency key for one concrete kill resolution; retries must reuse same value. */
  finishNonce?: string;
  /** CAS guard against stale client snapshot. */
  expectedRevision: number;
  /** true = hero had Auto Spoil / Sweep active */
  spoiled?: boolean;
  /** Zone id where the mob was killed */
  zoneId?: string;
  /** 1–9; частка нагороди в пати (як у клієнта). */
  partySize?: number;
  /** 1–10; множник (Whirlwind cleave). */
  lootMultiplier?: number;
  /** Застаріло — сервер рахує EXP/SP з mobId. */
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
  /** Quest item drops (client-side, validated by server) */
  questDrops?: Array<{ id: string; count: number; name?: string; kind?: string; slot?: string; icon?: string }>;
  /** Partial heroJson patch (kill counters + last-kill meta only; progression is server-authoritative). */
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
