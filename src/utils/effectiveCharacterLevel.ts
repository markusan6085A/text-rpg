import { MAX_LEVEL } from "../data/expTable";

/**
 * Рівень для UI: колонка `Character.level` і `heroJson.level` часто тимчасово розходяться
 * (прогрес живе в heroJson; PUT не завжди синхронізує колонку).
 * Math.max давав «стрибки» лвла (20 / 31 / 40) при кожному перезавантаженні профілю.
 * Пріоритет — heroJson, як у readCharacterProgress; інакше колонка.
 */
export function effectiveCharacterLevel(character: {
  level?: number | null;
  heroJson?: unknown;
}): number {
  const hj = (character.heroJson as Record<string, unknown>) || {};
  const fromJson = Number(hj.level);
  if (Number.isFinite(fromJson) && fromJson > 0) {
    return Math.max(1, Math.min(Math.floor(fromJson), MAX_LEVEL));
  }
  const fromCol = Number(character.level);
  if (Number.isFinite(fromCol) && fromCol > 0) {
    return Math.max(1, Math.min(Math.floor(fromCol), MAX_LEVEL));
  }
  return 1;
}
