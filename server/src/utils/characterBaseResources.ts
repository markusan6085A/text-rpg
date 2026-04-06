/**
 * DB-backed base max HP/MP/CP (level + equip, без бафів).
 * heroJson.maxHp/maxMp/maxCp у відповідях API збігаються з колонками; displayResources — серверний buffed HUD (див. statsRecalc bundle).
 */

import fs from "node:fs";
import path from "node:path";

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

/**
 * Пріоритет: лише явні baseMax* у json, інакше існуючі колонки БД.
 * Не підставляємо maxHp/maxMp/maxCp — у збереженому json вони могли бути бафнутими;
 * дубль з max* → колонки БД → подвійний наклад бафів на клієнті.
 */
export function deriveBaseResourceColumnsFromHeroJson(
  hj: Record<string, any> | null | undefined,
  existingCols: BaseResourceColumns,
): BaseResourceColumns {
  const h = hj || {};
  const pickBaseOnly = (baseKey: string, existingVal: number) => {
    const fromBase = Math.floor(Number(h[baseKey]));
    if (Number.isFinite(fromBase) && fromBase >= 1) return fromBase;
    return existingVal;
  };
  const ex = coerceBaseResourceTriplet(existingCols);
  return coerceBaseResourceTriplet({
    baseMaxHp: pickBaseOnly("baseMaxHp", ex.baseMaxHp),
    baseMaxMp: pickBaseOnly("baseMaxMp", ex.baseMaxMp),
    baseMaxCp: pickBaseOnly("baseMaxCp", ex.baseMaxCp),
  });
}

function resolveStatsRecalcBundlePath(): string | null {
  const candidates = [
    path.join(__dirname, "../statsRecalc.cjs"),
    path.join(__dirname, "../../dist/statsRecalc.cjs"),
    path.join(process.cwd(), "server/dist/statsRecalc.cjs"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Buffed HP/MP/CP для HUD — той самий computeBuffedMaxResources + ratio, що на клієнті (з bundle). */
function attachServerDisplayResourcesForApi(
  heroJson: Record<string, any>,
  cols: BaseResourceColumns,
): Record<string, any> {
  const p = resolveStatsRecalcBundlePath();
  if (!p) return heroJson;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require(p) as { computeServerDisplayResources?: (a: any) => any };
    if (typeof m.computeServerDisplayResources !== "function") return heroJson;
    const dr = m.computeServerDisplayResources({
      heroJson,
      baseCaps: { maxHp: cols.baseMaxHp, maxMp: cols.baseMaxMp, maxCp: cols.baseMaxCp },
    });
    return { ...heroJson, displayResources: dr };
  } catch {
    return heroJson;
  }
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
  const injected = injectColumnBaseResourcesIntoHeroJson(character.heroJson, cols);
  const heroJson = attachServerDisplayResourcesForApi(injected, cols);
  return {
    ...character,
    heroJson,
    baseMaxHp: cols.baseMaxHp,
    baseMaxMp: cols.baseMaxMp,
    baseMaxCp: cols.baseMaxCp,
  };
}
