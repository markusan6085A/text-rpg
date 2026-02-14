// src/utils/premium/isPremiumActive.ts
import type { Hero } from "../../types/Hero";

/**
 * Перевіряє, чи активний преміум аккаунт
 * premiumUntil може бути в hero.premiumUntil або hero.heroJson.premiumUntil (після load з API)
 */
export function isPremiumActive(hero: Hero | null): boolean {
  if (!hero) return false;
  const until = hero.premiumUntil ?? (hero as any)?.heroJson?.premiumUntil;
  if (!until) return false;
  return until > Date.now();
}

/**
 * Отримує множник для преміум аккаунту (2x якщо активний, 1x якщо ні)
 */
export function getPremiumMultiplier(hero: Hero | null): number {
  return isPremiumActive(hero) ? 2 : 1;
}

