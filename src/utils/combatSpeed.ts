// Мінімальні ліміти
const MIN_AUTO_ATTACK_MS = 300;
const BASE_AUTO_ATTACK_MS = 1000;

const MIN_PHYSICAL_SKILL_CD_MULT = 0.3;

/**
 * Auto-attack interval (ms)
 * База: 1000 ms
 * Мінімум: 300 ms
 * Формула: interval = base / (1 + attackSpeed / 1000)
 */
export function calcAutoAttackInterval(attackSpeed: number): number {
  const speed = Math.max(0, attackSpeed);

  const interval = BASE_AUTO_ATTACK_MS / (1 + speed / 1000);

  return Math.max(MIN_AUTO_ATTACK_MS, Math.round(interval));
}

/**
 * Cooldown фізичного скіла (ms)
 * attackSpeed зменшує cooldown
 * Мінімум: 30% від бази
 * Формула: finalCd = baseCd * (1 / (1 + attackSpeed / 1000))
 * Обмеження: finalCd >= baseCd * 0.3
 */
export function calcPhysicalSkillCooldown(
  baseCooldownSec: number,
  attackSpeed: number
): number {
  const baseMs = baseCooldownSec * 1000;
  const speed = Math.max(0, attackSpeed);

  const reduced = baseMs / (1 + speed / 1000);

  const minAllowed = baseMs * MIN_PHYSICAL_SKILL_CD_MULT;

  return Math.max(Math.round(reduced), Math.round(minAllowed));
}


