import { SkillDefinition, SkillLevelDefinition } from "../types";

export function calculateMagicDamage(
  caster: any,
  target: any,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): number {
  const mAtk = Math.max(1, caster?.mAtk ?? 1);
  const mDef = Math.max(1, target?.mDef ?? 1);
  const power = Math.max(1, level.power ?? 1);

  // Базовий урон скіла = power скіла
  const skillBaseDamage = power;
  
  // Базовий урон героя з урахуванням захисту
  // Магічні скіли повинні наносити більше урону, ніж прості атаки
  // Використовуємо 80% від mAtk для магічних скілів
  const ratio = mAtk / mDef;
  // Для магічних скілів використовуємо 0.8 (80% від mAtk)
  const heroBaseDamage = mAtk * 0.8 * (1 + ratio * 0.05); // Магічні скіли наносять 80% від mAtk
  
  // Сумарний базовий урон = урон скіла + базовий урон героя
  const base = skillBaseDamage + heroBaseDamage;

  const skillBonus = 1 + ((caster?.magicSkillPower ?? 0) / 100);

  // Elemental attack/resist bonus: fire/water/wind/earth/holy/dark
  const element = skill.element;
  const attackBonus =
    element === "fire"
      ? caster?.fireAttack ?? 0
      : element === "water"
      ? caster?.waterAttack ?? 0
      : element === "wind"
      ? caster?.windAttack ?? 0
      : element === "earth"
      ? caster?.earthAttack ?? 0
      : element === "holy"
      ? caster?.holyAttack ?? 0
      : element === "dark"
      ? caster?.darkAttack ?? 0
      : 0;

  const resistPenalty =
    element === "fire"
      ? target?.fireResist ?? 0
      : element === "water"
      ? target?.waterResist ?? 0
      : element === "wind"
      ? target?.windResist ?? 0
      : element === "earth"
      ? target?.earthResist ?? 0
      : element === "holy"
      ? target?.holyResist ?? 0
      : element === "dark"
      ? target?.darkResist ?? 0
      : 0;

  const elementMultiplier =
    (1 + Math.max(0, attackBonus) / 100) * (1 - Math.max(0, resistPenalty) / 100);

  const variance = 0.9 + Math.random() * 0.2; // 0.9 - 1.1

  const raw = base * skillBonus * elementMultiplier * variance;
  return Math.max(1, Math.floor(raw));
}

