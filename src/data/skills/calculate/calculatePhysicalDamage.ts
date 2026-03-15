import { SkillDefinition, SkillLevelDefinition } from "../types";
import { L2_PHYSICAL_COEFFICIENT, L2_PVE_DAMAGE_MULTIPLIER } from "../../../data/balance";

/** L2-стиль формула фізичного урону скілів: C * (pAtk + 2*power) / pDef */
export function calculatePhysicalDamage(
  attacker: any,
  target: any,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): number {
  const pAtk = Math.max(1, attacker?.pAtk ?? 1);
  const pDef = Math.max(1, target?.pDef ?? 1);
  const power = Math.max(1, level.power ?? 1);

  // L2-стиль: damage = 70 * (pAtk + 2*power) / pDef (skill formula from L2)
  const l2Base = L2_PHYSICAL_COEFFICIENT * (pAtk + 2 * power) / pDef * L2_PVE_DAMAGE_MULTIPLIER;

  const skillBonus = 1 + ((attacker?.physSkillPower ?? 0) / 100);
  const variance = 0.8 + Math.random() * 0.4; // 0.8 - 1.2

  const raw = l2Base * skillBonus * variance;
  return Math.max(1, Math.floor(raw));
}

