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

  // ✅ Не повертаємо max менший за вже наявний у героя (hero.maxHp/baseMaxHp); heroJson — лише fallback, не пріоритет.
  // Інакше тік (regenTick/processMobAttack) робить curHP = min(maxHp, hero.hp) і HP "падає" після F5.
  const heroAny = hero as any;
  const candidatesHp = [
    heroAny.baseMaxHp,
    hero.maxHp,
    heroAny.heroJson?.maxHp,
    hero.hp,
  ].map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
  const candidatesMp = [
    heroAny.baseMaxMp,
    hero.maxMp,
    heroAny.heroJson?.maxMp,
    hero.mp,
  ].map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
  const baseMaxHp = candidatesHp.length ? Math.max(...candidatesHp) : 1;
  const baseMaxMp = candidatesMp.length ? Math.max(...candidatesMp) : 1;
  const candidatesCp = [
    heroAny.baseMaxCp,
    hero.maxCp,
    heroAny.heroJson?.maxCp,
  ].map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
  const baseMaxCp = candidatesCp.length ? Math.max(...candidatesCp) : Math.max(1, Math.round(baseMaxHp * 0.6));

  return {
    maxHp: Math.max(1, baseMaxHp),
    maxMp: Math.max(1, baseMaxMp),
    maxCp: Math.max(1, baseMaxCp),
  };
}

