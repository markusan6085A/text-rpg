/**
 * ЄДИНЕ джерело правди для max ресурсів героя
 *
 * ❗ Правила:
 * - maxHp / maxMp / maxCp завжди беруться з hero
 * - BattleState НІКОЛИ не зберігає ресурси
 * - Ця функція не мутує hero
 * - Якщо в БД/heroJson залишились плейсхолдери 1, а формули дають нормальні max — беремо max(збережене, похідне)
 */
import { calcBaseStats } from "../../../utils/stats/calcBaseStats";
import { applyBaseStatGrowthByClass } from "../../../utils/stats/applyBaseStatGrowth";
import { calcResources } from "../../../utils/stats/calcResources";

export type HeroResourcesSource = {
  maxHp?: number;
  maxMp?: number;
  maxCp?: number;
  hp?: number;
  mp?: number;
  cp?: number;
};

/** Нижня оцінка base max з тих самих формул, що й UI-бойові стати (calcResources), без пасивів/бафів. */
export function getDerivedMaxResourcesFromFormulas(hero: HeroResourcesSource | null): {
  maxHp: number;
  maxMp: number;
  maxCp: number;
} {
  if (!hero) return { maxHp: 1, maxMp: 1, maxCp: 1 };
  const h = hero as any;
  const originalBaseStats =
    h.baseStatsInitial ||
    h.baseStats ||
    calcBaseStats(h.race || "Human", h.klass || h.profession || "Fighter");
  const level = h.level || 1;
  let grownBaseStats = applyBaseStatGrowthByClass(
    originalBaseStats,
    level,
    h.klass,
    h.profession
  );
  if (h.activeDyes && h.activeDyes.length > 0) {
    grownBaseStats = { ...grownBaseStats };
    for (const dye of h.activeDyes) {
      const minStat = 3;
      grownBaseStats[dye.statPlus] = (grownBaseStats[dye.statPlus] || 0) + dye.effect;
      grownBaseStats[dye.statMinus] = Math.max(
        minStat,
        (grownBaseStats[dye.statMinus] || 0) - dye.effect
      );
    }
  }
  const r = calcResources(grownBaseStats, level, h.equipment, h.equipmentEnchantLevels);
  return {
    maxHp: Math.max(1, r.maxHp),
    maxMp: Math.max(1, r.maxMp),
    maxCp: Math.max(1, r.maxCp),
  };
}

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

  const fromStored = {
    maxHp: Math.max(1, Number.isFinite(baseMaxHp) ? baseMaxHp : 1),
    maxMp: Math.max(1, Number.isFinite(baseMaxMp) ? baseMaxMp : 1),
    maxCp: Math.max(1, Number.isFinite(baseMaxCp) ? baseMaxCp : 1),
  };
  const derived = getDerivedMaxResourcesFromFormulas(hero);
  return {
    maxHp: Math.max(fromStored.maxHp, derived.maxHp),
    maxMp: Math.max(fromStored.maxMp, derived.maxMp),
    maxCp: Math.max(fromStored.maxCp, derived.maxCp),
  };
}

