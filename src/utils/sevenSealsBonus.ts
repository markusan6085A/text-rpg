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

/** Сума плоских бонусів до статів (для порівняння двох записів). */
function statSumSevenSeals(b: SevenSealsBonusLike): number {
  return (
    (Number(b.pAtk) || 0) +
    (Number(b.mAtk) || 0) +
    (Number(b.pDef) || 0) +
    (Number(b.mDef) || 0)
  );
}

/** Активний за expiresAt бонус або undefined. */
export function pickActiveSevenSealsBonus(v: unknown): SevenSealsBonusLike | undefined {
  if (!v || typeof v !== "object") return undefined;
  const exp = Number((v as SevenSealsBonusLike).expiresAt) || 0;
  if (exp <= Date.now()) return undefined;
  return v as SevenSealsBonusLike;
}

/**
 * Два джерела (heroJson vs верхній рівень героя) після часткового merge/збереження можуть розійтися:
 * в heroJson лишається запис з expiresAt без чисел, а повні pAtk/… — на hero.sevenSealsBonus.
 * Беремо активний запис із більшою сумою бонусів до статів (при рівності — більший rank).
 */
export function mergeActiveSevenSealsBonus(a: unknown, b: unknown): SevenSealsBonusLike | undefined {
  const pa = pickActiveSevenSealsBonus(a);
  const pb = pickActiveSevenSealsBonus(b);
  if (!pa && !pb) return undefined;
  if (!pa) return pb;
  if (!pb) return pa;
  const sa = statSumSevenSeals(pa);
  const sb = statSumSevenSeals(pb);
  if (sa !== sb) return sa >= sb ? pa : pb;
  const ra = Number(pa.rank) || 0;
  const rb = Number(pb.rank) || 0;
  return ra >= rb ? pa : pb;
}

/** Бонус з БД/GET: у `character.heroJson` він у корені JSON; після спреду в Hero може бути `hero.sevenSealsBonus` або `hero.heroJson.sevenSealsBonus`. */
export function getSevenSealsBonusFromHero(hero: unknown): SevenSealsBonusLike | undefined {
  if (!hero || typeof hero !== "object") return undefined;
  const h = hero as Record<string, unknown>;
  const hj = h.heroJson as Record<string, unknown> | undefined;
  return mergeActiveSevenSealsBonus(hj?.sevenSealsBonus, h.sevenSealsBonus);
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
