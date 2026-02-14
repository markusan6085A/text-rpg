/**
 * ЄДИНЕ джерело правди для max ресурсів героя
 *
 * ❗ Правила:
 * - maxHp / maxMp / maxCp завжди беруться з hero
 * - BattleState НІКОЛИ не зберігає ресурси
 * - Ця функція не мутує hero
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

  // ✅ base-first — завжди беремо base без бафів, щоб computeBuffedMaxResources додав бафи один раз
  const heroAny = hero as any;
  const baseMaxHp = Number(heroAny.baseMaxHp ?? heroAny.heroJson?.maxHp ?? hero.maxHp ?? hero.hp ?? 1);
  const baseMaxMp = Number(heroAny.baseMaxMp ?? heroAny.heroJson?.maxMp ?? hero.maxMp ?? hero.mp ?? 1);
  const baseMaxCp = Number(heroAny.baseMaxCp ?? heroAny.heroJson?.maxCp ?? hero.maxCp ?? Math.max(1, Math.round(baseMaxHp * 0.6)));

  return {
    maxHp: Math.max(1, baseMaxHp),
    maxMp: Math.max(1, baseMaxMp),
    maxCp: Math.max(1, baseMaxCp),
  };
}

