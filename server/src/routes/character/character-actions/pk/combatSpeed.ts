/** Дзеркало client `src/utils/combatSpeed.ts` — КД фіз. скілів від attackSpeed. */
const MIN_PHYSICAL_SKILL_CD_MULT = 0.3;

export function calcPhysicalSkillCooldown(baseCooldownSec: number, attackSpeed: number): number {
  const baseMs = baseCooldownSec * 1000;
  const speed = Math.max(0, attackSpeed);
  const reduced = baseMs / (1 + speed / 1000);
  const minAllowed = baseMs * MIN_PHYSICAL_SKILL_CD_MULT;
  return Math.max(Math.round(reduced), Math.round(minAllowed));
}
