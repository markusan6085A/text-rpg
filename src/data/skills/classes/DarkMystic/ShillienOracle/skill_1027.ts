import { SkillDefinition } from "../../../types";

// Group Heal (levels 4-15 for Shillien Oracle)
export const skill_1027: SkillDefinition = {
  id: 1027,
  code: "DMO_1027",
  name: "Group Heal",
  description:
    "Recovers party member's HP. Dark Elf Oracle progression (20-35).\n\nВосстанавливает HP членов группы. Прогрессия Темного Эльфа Оракула (20-35). Эффект Group Heal, радиус 1000 вокруг себя. Восстанавливает 97-241 HP (зависит от уровня). Каст: 7 сек. Перезарядка: 25 сек.",
  icon: "/skills/Skill1027_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "party",
  castTime: 7,
  cooldown: 25,
  levels: [
    { level: 4, requiredLevel: 20, spCost: 1100, mpCost: 48, power: 97 },
    { level: 5, requiredLevel: 20, spCost: 1100, mpCost: 53, power: 108 },
    { level: 6, requiredLevel: 20, spCost: 1100, mpCost: 59, power: 121 },
    { level: 7, requiredLevel: 25, spCost: 2300, mpCost: 65, power: 141 },
    { level: 8, requiredLevel: 25, spCost: 2300, mpCost: 69, power: 148 },
    { level: 9, requiredLevel: 25, spCost: 2300, mpCost: 72, power: 156 },
    { level: 10, requiredLevel: 30, spCost: 4400, mpCost: 83, power: 179 },
    { level: 11, requiredLevel: 30, spCost: 4400, mpCost: 87, power: 188 },
    { level: 12, requiredLevel: 30, spCost: 4400, mpCost: 88, power: 196 },
    { level: 13, requiredLevel: 35, spCost: 7300, mpCost: 95, power: 222 },
    { level: 14, requiredLevel: 35, spCost: 7300, mpCost: 99, power: 231 },
    { level: 15, requiredLevel: 35, spCost: 7300, mpCost: 103, power: 241 },
  ],
};

