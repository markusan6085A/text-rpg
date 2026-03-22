/** Рівень з БД і з heroJson інколи розходяться — для відображення беремо максимум достовірних значень. */
export function effectiveCharacterLevel(character: {
  level?: number | null;
  heroJson?: unknown;
}): number {
  const hj = (character.heroJson as Record<string, unknown>) || {};
  const fromCol = Number(character.level);
  const fromJson = Number(hj.level);
  const a = Number.isFinite(fromCol) && fromCol > 0 ? fromCol : 0;
  const b = Number.isFinite(fromJson) && fromJson > 0 ? fromJson : 0;
  const m = Math.max(a, b);
  return m > 0 ? m : 1;
}
