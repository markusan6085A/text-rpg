/**
 * Єдине джерело правди для регену HP/MP/CP.
 * Використовується в бою (regenTick), в місті/idle (StatusBars), скрізь.
 * Повертає реген за 1 секунду (для інтервалу N сек — множити на N).
 */
import { applyBuffsToStats } from "../battle/helpers";

export type BuffForRegen = { id?: number; name?: string; stackType?: string; effects?: unknown[]; expiresAt?: number };

/** Приймає будь-який об'єкт з полями level, battleStats (наприклад Hero). Реген як у статах — з battleStats + бафи; якщо статів немає — базова формула за рівнем (як у calcCombatStats). */
export function getHeroRegenPerSecond(
  hero: { level?: number; battleStats?: { hpRegen?: number; mpRegen?: number; cpRegen?: number } | null } | null,
  buffs: BuffForRegen[] = []
): { hpRegen: number; mpRegen: number; cpRegen: number } {
  if (!hero) {
    return { hpRegen: 0, mpRegen: 0, cpRegen: 0 };
  }

  const heroStats = applyBuffsToStats(hero.battleStats || {}, buffs as any);
  const lvl = Math.max(1, Number(hero.level) || 1);
  // Та сама базова формула, що в calcCombatStats (реген як описаний в статах)
  const baseHp = Math.max(1, Math.round(8 + (lvl - 1) * 0.1));
  const baseMp = Math.max(1, Math.round(12 + (lvl - 1) * 0.1));
  const baseCp = Math.max(1, Math.round(7 + (lvl - 1) * 0.06));

  return {
    hpRegen: Math.max(0, heroStats.hpRegen ?? baseHp),
    mpRegen: Math.max(0, heroStats.mpRegen ?? baseMp),
    cpRegen: Math.max(0, heroStats.cpRegen ?? baseCp),
  };
}
