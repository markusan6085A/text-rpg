import { SkillDefinition } from "../../../types";

export const skill_1184: SkillDefinition = {
  id: 1184,
  code: "HM_1184",
  name: "Ice Bolt",
  description: "Freezing attack that temporarily slows enemy's Speed. Effect 2. Power 14.\n\nЗамораживающая атака, которая временно замедляет скорость врага на 30% на 2 мин. Сила: 8-16 (зависит от уровня). Каст: 3.1 сек. Перезарядка: 8 сек.",
  icon: "/skills/Skill1184_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3.1,
  cooldown: 8,
  levels: [
    { level: 1, requiredLevel: 7, spCost: 240, mpCost: 9, power: 8 },
    { level: 2, requiredLevel: 7, spCost: 240, mpCost: 10, power: 9 },
    { level: 3, requiredLevel: 14, spCost: 1100, mpCost: 14, power: 11 },
    { level: 4, requiredLevel: 14, spCost: 1100, mpCost: 15, power: 13 },
  ],
};


