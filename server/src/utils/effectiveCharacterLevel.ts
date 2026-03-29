import { MAX_LEVEL } from "../expTable";

/**
 * Для відображення: пріоритет heroJson.level (канон після геймплею), інакше колонка.
 * Math.max(col, json) давав нестабільний лвл у списках/профілі при розсинхроні з БД.
 */
export function effectiveCharacterLevel(char: { level?: number | null; heroJson?: unknown }): number {
  const hj = (char.heroJson as Record<string, unknown>) || {};
  const fromJson = Number(hj.level);
  if (Number.isFinite(fromJson) && fromJson > 0) {
    return Math.max(1, Math.min(Math.floor(fromJson), MAX_LEVEL));
  }
  const fromCol = Number(char.level);
  if (Number.isFinite(fromCol) && fromCol > 0) {
    return Math.max(1, Math.min(Math.floor(fromCol), MAX_LEVEL));
  }
  return 1;
}
