/**
 * Відсоткове зменшення вхідного урону (поле `damageTakenReduction` з екіпу → `battleStats`).
 * Застосування в проєкті: `processMobAttack` (удар РБ/мабів, агро-моби), патруль `locationPatrolAggro`,
 * тик кровотечі від мобів у `regenTick`. Не застосовується до добровільних витрат HP (toggle skills).
 * Кап 90%.
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
