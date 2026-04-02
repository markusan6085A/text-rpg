/**
 * Відсоткове зменшення вхідного урону (екіпірування / пасивні поля battleStats).
 * Кап 90%, щоб ніколи не «знищувати» шкоду до нуля через множник alone.
 */
export function applyPercentDamageTakenReduction(
  damage: number,
  reductionPercent: number | undefined,
  opts?: { invulnerable?: boolean }
): number {
  if (opts?.invulnerable || damage <= 0) return damage;
  if (reductionPercent == null || !Number.isFinite(reductionPercent) || reductionPercent <= 0) {
    return damage;
  }
  const pct = Math.max(0, Math.min(90, reductionPercent));
  return Math.max(0, Math.round(damage * (1 - pct / 100)));
}
