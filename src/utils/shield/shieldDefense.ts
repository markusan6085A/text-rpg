import { itemsDB } from "../../data/items/itemsDB";
import type { Hero } from "../../types/Hero";
import type { CombatStats } from "../stats/calcCombatStats";

/** Максимальний шанс блоку щитом (%), узгоджено з L2 (не більше ~80%). */
export const MAX_SHIELD_BLOCK_RATE = 80;

export function clampShieldBlockRate(rate: number): number {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return 0;
  return Math.min(MAX_SHIELD_BLOCK_RATE, Math.max(0, rate));
}

/**
 * Перевіряє, чи надітий щит
 */
export function hasShieldEquipped(hero: Hero | null): boolean {
  if (!hero || !hero.equipment) return false;
  const shieldId = hero.equipment.shield;
  if (!shieldId) return false;
  
  const shieldItem = itemsDB[shieldId];
  if (!shieldItem) return false;
  
  // Перевіряємо, чи це дійсно щит (по slot або kind)
  return shieldItem.slot === "shield" || shieldItem.kind === "shield";
}

/**
 * Обчислює базовий захист щитом (з екіпіровки)
 */
export function getBaseShieldDefense(hero: Hero | null): number {
  if (!hasShieldEquipped(hero)) return 0;
  
  const shieldId = hero!.equipment!.shield;
  if (!shieldId) return 0;
  
  const shieldItem = itemsDB[shieldId];
  if (!shieldItem || !shieldItem.stats) return 0;
  
  // Базовий захист від щита (pDef від щита)
  return shieldItem.stats.pDef ?? 0;
}

/**
 * Обчислює загальний захист щитом (тільки pDef від щита)
 * shieldBlockRate - це шанс блоку, а не захист
 */
export function getTotalShieldDefense(
  hero: Hero | null,
  combatStats: CombatStats
): number {
  if (!hasShieldEquipped(hero)) return 0;
  
  // Повертаємо тільки pDef від щита (без shieldBlockRate, бо це шанс блоку)
  return getBaseShieldDefense(hero);
}

/**
 * Перевіряє, чи спрацював блок щита на основі shieldBlockRate
 * @param shieldBlockRate - шанс блоку у відсотках (0…MAX_SHIELD_BLOCK_RATE)
 */
export function checkShieldBlock(shieldBlockRate: number): boolean {
  const clampedRate = clampShieldBlockRate(shieldBlockRate);
  if (clampedRate <= 0) return false;
  return Math.random() * 100 < clampedRate;
}

/** Сума pDef щита з екіпа + бонус «крепость щита» (Shield Fortress) при успішному блоці. */
export function getShieldMitigationTotal(hero: Hero | null, combatStats: CombatStats): number {
  const base = getTotalShieldDefense(hero, combatStats);
  const fort = combatStats.shieldFortressDefense;
  const add = typeof fort === "number" && Number.isFinite(fort) ? Math.max(0, Math.round(fort)) : 0;
  return base + add;
}

