// Мінімальні ліміти
const MIN_AUTO_ATTACK_MS = 300;
const BASE_AUTO_ATTACK_MS = 2500; // База 2.5 сек (без шмоту)
const ATTACK_SPEED_CAP = 8000;   // При 8к швидкості атаки → інтервал 300 мс (фул баф + шмот)

const MIN_PHYSICAL_SKILL_CD_MULT = 0.3;

/**
 * Auto-attack interval (ms)
 * База: 2.5 сек (2500 ms)
 * Мінімум: 300 ms (при attackSpeed >= 8000 — фул баф + шмот)
 * Формула: interval = base / (1 + attackSpeed / 1000)
 */
export function calcAutoAttackInterval(attackSpeed: number): number {
  const speed = Number.isFinite(attackSpeed) ? Math.max(0, attackSpeed) : 0;

  if (speed >= ATTACK_SPEED_CAP) {
    return MIN_AUTO_ATTACK_MS;
  }

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
  const speed = Number.isFinite(attackSpeed) ? Math.max(0, attackSpeed) : 0;

  const reduced = baseMs / (1 + speed / 1000);

  const minAllowed = baseMs * MIN_PHYSICAL_SKILL_CD_MULT;

  return Math.max(Math.round(reduced), Math.round(minAllowed));
}


