import { SkillDefinition } from "../../../types";

// Ice Bolt - freezing attack that temporarily slows enemy's Speed
export const skill_1184: SkillDefinition = {
  id: 1184,
  code: "EM_1184",
  name: "Ice Bolt",
  description: "Freezing attack that temporarily slows enemy's Speed. Effect 2. Power 8. Slows enemy for 2 sec with base chance 60% (resistance depends on WIT stat).\n\nЗамораживающая атака, которая временно замедляет скорость врага на 30% на 2 сек. Сила: 8-13 (зависит от уровня). Каст: 3.1 сек. Перезарядка: 8 сек. Шанс 60% (зависит от WIT стата).",
  icon: "/skills/Skill1184_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "water",
  castTime: 3.1,
  cooldown: 8,
  duration: 2,
  chance: 60,
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7, resistStat: "wit" }, // 30% speed reduction
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 260, mpCost: 9, power: 8 },
    { level: 2, requiredLevel: 7, spCost: 260, mpCost: 10, power: 9 },
    { level: 3, requiredLevel: 14, spCost: 1100, mpCost: 14, power: 11 },
    { level: 4, requiredLevel: 14, spCost: 1100, mpCost: 15, power: 13 },
  ],
};

