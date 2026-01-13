import { itemsDB } from "../../data/items/itemsDB";
import type { Hero } from "../../types/Hero";
import type { CombatStats } from "../stats/calcCombatStats";

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
 * @param shieldBlockRate - шанс блоку у відсотках (0-100)
 * @returns true якщо блок спрацював, false якщо ні
 */
export function checkShieldBlock(shieldBlockRate: number): boolean {
  if (shieldBlockRate <= 0) return false;
  // Обмежуємо шанс блоку максимумом 100%
  const clampedRate = Math.min(100, Math.max(0, shieldBlockRate));
  // shieldBlockRate - це шанс у відсотках (0-100)
  return Math.random() * 100 < clampedRate;
}

