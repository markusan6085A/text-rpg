/**
 * Паритет з server/src/pveBattle/pveHitChance.ts — при зміні формули оновлювати обидва файли.
 */
import type { Hero } from "../../types/Hero";

export function clampPlayerAccuracy(raw: unknown): number {
  return Math.min(500, Math.max(0, Math.floor(Number(raw) || 0)));
}

/**
 * Шанс влучання гравця по мобу, % (ціле), кламп 5..95.
 * Формула: 100 * (accuracy + C) / (accuracy + evasion + C)
 */
export function hitChancePercentVsMob(accuracy: number, mobEvasion: number): number {
  const a = Math.max(1, Math.min(500, Math.floor(accuracy)));
  const e = Math.max(0, Math.min(120, Math.floor(mobEvasion)));
  const c = 40;
  const pct = (100 * (a + c)) / (a + e + c);
  return Math.min(95, Math.max(5, Math.round(pct)));
}

/**
 * Ухилення «орієнтира» для екрану статів поза боєм — як у типового моба того ж рівня (не РБ), див. applyPveBattleStart.
 */
export function referenceMobEvasionForHeroLevel(heroLevel: number): number {
  const lv = Math.max(1, Math.floor(heroLevel));
  const raw = Math.round(lv * 1.35);
  return Math.min(120, Math.max(0, Math.min(90, Math.max(3, raw))));
}

/**
 * У бою (онлайн PvE): ухилення поточної цілі з battleSession (як на сервері).
 * Поза боєм: орієнтир за рівнем героя.
 */
export function getMobEvasionForPveHitDisplay(hero: Hero | null | undefined, inBattle: boolean): number {
  if (!hero) return 40;
  const sess = (hero as any)?.heroJson?.battleSession;
  if (
    inBattle &&
    sess &&
    typeof sess.mobEvasion === "number" &&
    Number.isFinite(sess.mobEvasion)
  ) {
    return Math.max(0, Math.min(120, Math.floor(Number(sess.mobEvasion))));
  }
  return referenceMobEvasionForHeroLevel(Number(hero.level) || 1);
}
