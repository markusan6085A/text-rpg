/** Чи бонус 7 Печатей активний (не прострочений) */
export function isSevenSealsBonusActive(bonus: { rank?: number; expiresAt?: number } | null | undefined): boolean {
  if (!bonus || typeof bonus !== "object") return false;
  const rank = bonus.rank;
  const expiresAt = bonus.expiresAt ?? 0;
  return rank >= 1 && rank <= 3 && expiresAt > Date.now();
}

/** Отримати ранг з активного бонусу (1|2|3 або null) */
export function getActiveSevenSealsRank(bonus: { rank?: number; expiresAt?: number } | null | undefined): number | null {
  if (!isSevenSealsBonusActive(bonus)) return null;
  const rank = bonus!.rank!;
  return rank >= 1 && rank <= 3 ? rank : null;
}
