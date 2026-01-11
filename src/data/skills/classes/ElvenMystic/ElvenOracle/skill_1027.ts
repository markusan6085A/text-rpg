import { SkillDefinition } from "../../../types";

// Group Heal - recovers party member's HP
// З XML: levels="15", power: 66-241, mpConsume: 26-82
// Для Elven Oracle: рівні 4-15 (requiredLevel: 20-35)
export const skill_1027: SkillDefinition = {
  id: 1027,
  code: "EO_1027",
  name: "Group Heal",
  description: "Recovers party member's HP. Power 66.\n\nВосстанавливает HP членов группы. Сила: 97-241 (зависит от уровня). Каст: 7 сек. Перезарядка: 25 сек.",
  icon: "/skills/Skill1027_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "party",
  castTime: 7,
  cooldown: 25,
  levels: [
    { level: 4, requiredLevel: 20, spCost: 1100, mpCost: 38, power: 97 },
    { level: 5, requiredLevel: 20, spCost: 1100, mpCost: 42, power: 108 },
    { level: 6, requiredLevel: 20, spCost: 1100, mpCost: 47, power: 121 },
    { level: 7, requiredLevel: 25, spCost: 2200, mpCost: 52, power: 141 },
    { level: 8, requiredLevel: 25, spCost: 2200, mpCost: 55, power: 148 },
    { level: 9, requiredLevel: 25, spCost: 2200, mpCost: 57, power: 156 },
    { level: 10, requiredLevel: 30, spCost: 4100, mpCost: 66, power: 179 },
    { level: 11, requiredLevel: 30, spCost: 4100, mpCost: 69, power: 188 },
    { level: 12, requiredLevel: 30, spCost: 4100, mpCost: 70, power: 196 },
    { level: 13, requiredLevel: 35, spCost: 6900, mpCost: 76, power: 222 },
    { level: 14, requiredLevel: 35, spCost: 6900, mpCost: 79, power: 231 },
    { level: 15, requiredLevel: 35, spCost: 6900, mpCost: 82, power: 241 },
  ],
};

