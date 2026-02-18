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

  // baseMax* — єдиний стабільний base-джерело. heroJson.maxHp теж base. hero.maxHp може бути buffed — лише останній fallback.
  // Не використовуємо hero.hp як кандидат для max (підміна).
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

