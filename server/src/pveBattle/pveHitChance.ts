/** PvE: влучання гравця по мобу (accuracy проти evasion моба). Паритет: src/utils/combat/pveHitChance.ts */

export function clampPlayerAccuracy(raw: unknown): number {
  return Math.min(500, Math.max(0, Math.floor(Number(raw) || 0)));
}

/**
 * Шанс влучання, % (ціле), кламп 5..95.
 * Формула: 100 * (accuracy + C) / (accuracy + evasion + C) — при рівних статах трохи >50%.
 */
export function hitChancePercentVsMob(accuracy: number, mobEvasion: number): number {
  const a = Math.max(1, Math.min(500, Math.floor(accuracy)));
  const e = Math.max(0, Math.min(120, Math.floor(mobEvasion)));
  const c = 40;
  const pct = (100 * (a + c)) / (a + e + c);
  return Math.min(95, Math.max(5, Math.round(pct)));
}

export function rollPvEAttackHit(hitChancePercent: number): boolean {
  const p = Math.min(95, Math.max(5, hitChancePercent));
  return Math.random() * 100 < p;
}
