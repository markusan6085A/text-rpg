/**
 * DB-backed base max HP/MP/CP (level + equip, без бафів).
 * heroJson.maxHp/maxMp/maxCp у відповідях API мають збігатися з колонками — клієнт накладає бафи локально.
 */

export const MAX_BASE_RESOURCE = 5_000_000;

export type BaseResourceColumns = {
  baseMaxHp: number;
  baseMaxMp: number;
  baseMaxCp: number;
};

export function coerceBaseResourceTriplet(raw: Partial<BaseResourceColumns> | null | undefined): BaseResourceColumns {
  const one = (n: unknown, fallback: number) => {
    const x = Math.floor(Number(n));
    if (!Number.isFinite(x) || x < 1) return Math.max(1, Math.min(MAX_BASE_RESOURCE, fallback));
    return Math.min(MAX_BASE_RESOURCE, Math.max(1, x));
  };
  return {
    baseMaxHp: one(raw?.baseMaxHp, 1),
    baseMaxMp: one(raw?.baseMaxMp, 1),
    baseMaxCp: one(raw?.baseMaxCp, 1),
  };
}

/** Підставляє base caps у heroJson і клампить поточні hp/mp/cp до base max. */
export function injectColumnBaseResourcesIntoHeroJson(
  hj: Record<string, any> | null | undefined,
  cols: BaseResourceColumns,
): Record<string, any> {
  const h = hj && typeof hj === "object" ? { ...hj } : {};
  const b = coerceBaseResourceTriplet(cols);
  h.maxHp = b.baseMaxHp;
  h.maxMp = b.baseMaxMp;
  h.maxCp = b.baseMaxCp;
  h.baseMaxHp = b.baseMaxHp;
  h.baseMaxMp = b.baseMaxMp;
  h.baseMaxCp = b.baseMaxCp;
  const clampR = (v: unknown, max: number) =>
    Math.min(max, Math.max(0, Math.floor(Number(v) || 0)));
  h.hp = clampR(h.hp, b.baseMaxHp);
  h.mp = clampR(h.mp, b.baseMaxMp);
  h.cp = clampR(h.cp, b.baseMaxCp);
  return h;
}

/** Пріоритет: явні baseMax* у json, інакше max*, інакше існуючі колонки БД. */
export function deriveBaseResourceColumnsFromHeroJson(
  hj: Record<string, any> | null | undefined,
  existingCols: BaseResourceColumns,
): BaseResourceColumns {
  const h = hj || {};
  const pick = (baseKey: string, maxKey: string, existingVal: number) => {
    const fromBase = Math.floor(Number(h[baseKey]));
    if (Number.isFinite(fromBase) && fromBase >= 1) return fromBase;
    const fromMax = Math.floor(Number(h[maxKey]));
    if (Number.isFinite(fromMax) && fromMax >= 1) return fromMax;
    return existingVal;
  };
  const ex = coerceBaseResourceTriplet(existingCols);
  return coerceBaseResourceTriplet({
    baseMaxHp: pick("baseMaxHp", "maxHp", ex.baseMaxHp),
    baseMaxMp: pick("baseMaxMp", "maxMp", ex.baseMaxMp),
    baseMaxCp: pick("baseMaxCp", "maxCp", ex.baseMaxCp),
  });
}

/** Відповідь API: синхронізувати heroJson.max* з колонками; якщо колонок у рядку немає — derive з heroJson. */
export function attachBaseResourcesForApi(character: Record<string, any> | null | undefined): Record<string, any> {
  if (!character || typeof character !== "object") return character as any;
  const fromRow = coerceBaseResourceTriplet({
    baseMaxHp: character.baseMaxHp,
    baseMaxMp: character.baseMaxMp,
    baseMaxCp: character.baseMaxCp,
  });
  const cols = deriveBaseResourceColumnsFromHeroJson(character.heroJson, fromRow);
  const heroJson = injectColumnBaseResourcesIntoHeroJson(character.heroJson, cols);
  return {
    ...character,
    heroJson,
    baseMaxHp: cols.baseMaxHp,
    baseMaxMp: cols.baseMaxMp,
    baseMaxCp: cols.baseMaxCp,
  };
}
