export type SevenSealsBonusLike = {
  pAtk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  rank?: number;
  expiresAt?: number;
  claimedWeekStart?: string;
  coinLuck?: number;
};

/** Бонус з БД/GET: у `character.heroJson` він у корені JSON; після спреду в Hero може бути `hero.sevenSealsBonus` або `hero.heroJson.sevenSealsBonus`. */
export function getSevenSealsBonusFromHero(hero: unknown): SevenSealsBonusLike | undefined {
  if (!hero || typeof hero !== "object") return undefined;
  const h = hero as Record<string, unknown>;
  const hj = h.heroJson as Record<string, unknown> | undefined;
  const fromHj = hj?.sevenSealsBonus;
  const fromTop = h.sevenSealsBonus;

  /** Лише непрострочений бонус; інакше порожній `{}` у heroJson не має «перекривати» валідний бонус з верхнього рівня після merge. */
  const pickActive = (v: unknown): SevenSealsBonusLike | undefined => {
    if (!v || typeof v !== "object") return undefined;
    const exp = Number((v as SevenSealsBonusLike).expiresAt) || 0;
    if (exp <= Date.now()) return undefined;
    return v as SevenSealsBonusLike;
  };

  return pickActive(fromHj) ?? pickActive(fromTop);
}

/** Чи бонус 7 Печатей активний (не прострочений) */
export function isSevenSealsBonusActive(bonus: { rank?: number; expiresAt?: number } | null | undefined): boolean {
  if (!bonus || typeof bonus !== "object") return false;
  const rank = Number((bonus as any).rank);
  const expiresAt = Number((bonus as any).expiresAt) || 0;
  return rank >= 1 && rank <= 3 && expiresAt > Date.now();
}

/** Отримати ранг з активного бонусу (1|2|3 або null) */
export function getActiveSevenSealsRank(bonus: { rank?: number; expiresAt?: number } | null | undefined): number | null {
  if (!isSevenSealsBonusActive(bonus)) return null;
  const rank = bonus!.rank!;
  return rank >= 1 && rank <= 3 ? rank : null;
}
