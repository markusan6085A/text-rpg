/**
 * Відсоток вампіризму зі skill definition (effects vampirism), узгоджено з клієнтом attackSkill.ts.
 * Для скілів без запису — 0 (лед тільки з бафів / heroCombatStats.vampirism).
 */
const BY_SKILL: Record<number, number> = {
  70: 20,
  289: 80,
  1090: 80,
  1147: 40,
  1234: 20,
  1245: 80,
  1343: 30,
};

export function pveVampirismPercentFromSkill(skillId: number): number {
  const v = BY_SKILL[skillId];
  return typeof v === "number" && v > 0 ? v : 0;
}
