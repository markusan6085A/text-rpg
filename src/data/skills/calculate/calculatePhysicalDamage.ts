import { SkillDefinition, SkillLevelDefinition } from "../types";
import { SKILL_PHYSICAL_ATK_FACTOR } from "../../../data/balance";

export function calculatePhysicalDamage(
  attacker: any,
  target: any,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): number {
  const pAtk = Math.max(1, attacker?.pAtk ?? 1);
  const pDef = Math.max(1, target?.pDef ?? 1);
  const power = Math.max(1, level.power ?? 1);

  // Базовий урон скіла = power скіла
  const skillBaseDamage = power;
  
  // Базовий урон героя з урахуванням захисту — скіли мають масштабуватися з pAtk
  const ratio = pAtk / pDef;
  const heroBaseDamage = pAtk * SKILL_PHYSICAL_ATK_FACTOR * (1 + ratio * 0.05);
  
  // Сумарний базовий урон = урон скіла + базовий урон героя
  const base = skillBaseDamage + heroBaseDamage;

  const skillBonus = 1 + ((attacker?.physSkillPower ?? 0) / 100);
  const variance = 0.8 + Math.random() * 0.4; // 0.8 - 1.2

  const raw = base * skillBonus * variance;
  return Math.max(1, Math.floor(raw));
}

