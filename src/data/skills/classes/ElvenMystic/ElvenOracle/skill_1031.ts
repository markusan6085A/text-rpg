import { SkillDefinition } from "../../../types";

// Disrupt Undead - does damage to undead monsters
// З XML: levels="8", mpConsume: 14-24, power: 19-36
// Для Elven Oracle: рівні 1-8 (requiredLevel: 20-35)
export const skill_1031: SkillDefinition = {
  id: 1031,
  code: "EO_1031",
  name: "Disrupt Undead",
  description: "Does damage to undead monsters. Power 19.\n\nНаносит урон нежити. Сила: 19-36 (зависит от уровня). Каст: 2.5 сек. Перезарядка: 4 сек.",
  icon: "/skills/skill1031.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "holy",
  castTime: 2.5,
  cooldown: 4,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 14, power: 19 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 16, power: 21 },
    { level: 3, requiredLevel: 25, spCost: 3200, mpCost: 17, power: 24 },
    { level: 4, requiredLevel: 25, spCost: 3200, mpCost: 18, power: 25 },
    { level: 5, requiredLevel: 30, spCost: 6200, mpCost: 20, power: 28 },
    { level: 6, requiredLevel: 30, spCost: 6200, mpCost: 21, power: 30 },
    { level: 7, requiredLevel: 35, spCost: 10000, mpCost: 23, power: 33 },
    { level: 8, requiredLevel: 35, spCost: 10000, mpCost: 24, power: 36 },
  ],
};
