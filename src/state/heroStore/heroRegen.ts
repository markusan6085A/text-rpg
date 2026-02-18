/**
 * Єдине джерело правди для регену HP/MP/CP.
 * Використовується в бою (regenTick), в місті/idle (StatusBars), скрізь.
 * Повертає реген за 1 секунду (для інтервалу N сек — множити на N).
 */
import { getMaxResources } from "../battle/helpers/getMaxResources";
import { computeBuffedMaxResources, applyBuffsToStats } from "../battle/helpers";

export type BuffForRegen = { id?: number; name?: string; stackType?: string; effects?: unknown[]; expiresAt?: number };

/** Приймає будь-який об'єкт з полями hp/mp/cp/maxHp/maxMp/maxCp та battleStats (наприклад Hero). */
export function getHeroRegenPerSecond(
  hero: { hp?: number; mp?: number; cp?: number; maxHp?: number; maxMp?: number; maxCp?: number; battleStats?: { hpRegen?: number; mpRegen?: number; cpRegen?: number } | null } | null,
  buffs: BuffForRegen[] = []
): { hpRegen: number; mpRegen: number; cpRegen: number } {
  if (!hero) {
    return { hpRegen: 0, mpRegen: 0, cpRegen: 0 };
  }

  const baseMax = getMaxResources(hero);
  const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, buffs as any);
  const heroStats = applyBuffsToStats(hero.battleStats || {}, buffs as any);

  // Якщо battleStats не має регену (наприклад поза боєм) — мінімальний % від макс за секунду
  const fallbackHp = Math.max(1, Math.round(maxHp * 0.01));
  const fallbackMp = Math.max(1, Math.round(maxMp * 0.015));
  const fallbackCp = Math.max(1, Math.round(maxCp * 0.025));

  return {
    hpRegen: Math.max(0, heroStats.hpRegen ?? fallbackHp),
    mpRegen: Math.max(0, heroStats.mpRegen ?? fallbackMp),
    cpRegen: Math.max(0, heroStats.cpRegen ?? fallbackCp),
  };
}
