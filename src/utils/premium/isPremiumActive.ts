// src/utils/premium/isPremiumActive.ts
import type { Hero } from "../../types/Hero";

/**
 * Перевіряє, чи активний преміум аккаунт
 */
export function isPremiumActive(hero: Hero | null): boolean {
  if (!hero || !hero.premiumUntil) return false;
  return hero.premiumUntil > Date.now();
}

/**
 * Отримує множник для преміум аккаунту (2x якщо активний, 1x якщо ні)
 */
export function getPremiumMultiplier(hero: Hero | null): number {
  return isPremiumActive(hero) ? 2 : 1;
}

