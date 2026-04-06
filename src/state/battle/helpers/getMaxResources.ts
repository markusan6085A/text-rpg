/**
 * Базові max HP/MP/CP для клієнтської логіки бою / бафів.
 *
 * ❗ Джерело правди — сервер (колонки character / heroJson після GET і snapshot мутацій).
 * Клієнт не підміняє max власними формулами; лише читає з hero.
 */
export type HeroResourcesSource = {
  maxHp?: number;
  maxMp?: number;
  maxCp?: number;
  hp?: number;
  mp?: number;
  cp?: number;
};

export function getMaxResources(
  hero: HeroResourcesSource | null
): {
  maxHp: number;
  maxMp: number;
  maxCp: number;
} {
  if (!hero) {
    return { maxHp: 1, maxMp: 1, maxCp: 1 };
  }

  // baseMax* — з API/heroJson; hero.maxHp може бути застарілим buffed fallback — лише останній запас.
  const h = hero as any;
  const baseMaxHp = Number(h.baseMaxHp ?? h.heroJson?.maxHp ?? h.maxHp ?? 1);
  const baseMaxMp = Number(h.baseMaxMp ?? h.heroJson?.maxMp ?? h.maxMp ?? 1);
  const baseMaxCp = Number(
    h.baseMaxCp ??
      h.heroJson?.maxCp ??
      h.maxCp ??
      Math.max(1, Math.round((Number.isFinite(baseMaxHp) ? baseMaxHp : 1) * 0.6))
  );

  return {
    maxHp: Math.max(1, Number.isFinite(baseMaxHp) ? baseMaxHp : 1),
    maxMp: Math.max(1, Number.isFinite(baseMaxMp) ? baseMaxMp : 1),
    maxCp: Math.max(1, Number.isFinite(baseMaxCp) ? baseMaxCp : 1),
  };
}
