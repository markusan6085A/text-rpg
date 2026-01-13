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

  const maxHp = hero.maxHp ?? hero.hp ?? 1;
  const maxMp = hero.maxMp ?? hero.mp ?? 1;

  // CP завжди залежить від HP, якщо явно не заданий
  const maxCp =
    hero.maxCp ??
    Math.max(1, Math.round(maxHp * 0.6));

  return {
    maxHp: Math.max(1, maxHp),
    maxMp: Math.max(1, maxMp),
    maxCp,
  };
}

