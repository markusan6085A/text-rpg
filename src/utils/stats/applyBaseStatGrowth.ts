/**
 * Застосовує ріст базових статів залежно від рівня та архетипу
 * L2-стиль: стати ростуть рідко, на певних рівнях
 */
import { STAT_GROWTH_LEVELS, CLASS_GROWTH, type Archetype } from "../../data/statGrowth";
import type { HeroBaseStats } from "../../types/Hero";

/**
 * Визначає архетип героя на основі класу або професії
 */
function detectArchetype(klass?: string, profession?: string): Archetype {
  const klassLower = (klass || "").toLowerCase();
  const professionLower = (profession || "").toLowerCase();
  
  // Перевіряємо клас
  if (klassLower.includes("mystic") || klassLower.includes("маг")) {
    return "mage";
  }
  if (klassLower.includes("fighter") || klassLower.includes("воин")) {
    return "fighter";
  }
  
  // Перевіряємо професію
  if (professionLower.includes("mystic") || professionLower.includes("elder") || 
      professionLower.includes("necromancer") || professionLower.includes("warlock")) {
    return "mage";
  }
  
  // За замовчуванням - fighter
  return "fighter";
}

/**
 * Застосовує ріст базових статів залежно від рівня та архетипу
 */
export function applyBaseStatGrowthByClass(
  baseStats: HeroBaseStats,
  level: number,
  klass?: string,
  profession?: string
): HeroBaseStats {
  // Захист від undefined baseStats
  const safeBaseStats: HeroBaseStats = {
    STR: baseStats.STR ?? 0,
    DEX: baseStats.DEX ?? 0,
    CON: baseStats.CON ?? 0,
    INT: baseStats.INT ?? 0,
    WIT: baseStats.WIT ?? 0,
    MEN: baseStats.MEN ?? 0,
  };
  
  // Підраховуємо кількість етапів росту, які герой вже пройшов
  const growthSteps = STAT_GROWTH_LEVELS.filter(l => level >= l).length;
  
  // Визначаємо архетип
  const archetype = detectArchetype(klass, profession);
  const growth = CLASS_GROWTH[archetype];
  
  // Застосовуємо ріст до кожного стату (покращений цикл для TypeScript)
  const result: HeroBaseStats = { ...safeBaseStats };
  
  (Object.keys(growth) as (keyof HeroBaseStats)[]).forEach(stat => {
    const weight = growth[stat];
    const growthValue = Math.floor(growthSteps * weight);
    result[stat] = safeBaseStats[stat] + growthValue;
  });
  
  return result;
}

