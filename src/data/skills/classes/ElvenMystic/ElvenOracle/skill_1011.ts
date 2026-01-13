import { SkillDefinition } from "../../../types";

// Heal - recovers HP
// З XML: levels="18", power: 49-301, mpConsume: 8-41
// Для Elven Oracle: рівні 7-18 (requiredLevel: 20-35)
export const skill_1011: SkillDefinition = {
  id: 1011,
  code: "EO_1011",
  name: "Heal",
  description: "Recovers HP. Power 49.\n\nВосстанавливает HP. Сила: 121-301 (зависит от уровня). Каст: 5 сек. Перезарядка: 10 сек.",
  icon: "/skills/Skill1011_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [
    { level: 7, requiredLevel: 20, spCost: 1100, mpCost: 21, power: 121 },
    { level: 8, requiredLevel: 20, spCost: 1100, mpCost: 24, power: 135 },
    { level: 9, requiredLevel: 20, spCost: 1100, mpCost: 26, power: 151 },
    { level: 10, requiredLevel: 25, spCost: 2200, mpCost: 28, power: 176 },
    { level: 11, requiredLevel: 25, spCost: 2200, mpCost: 29, power: 185 },
    { level: 12, requiredLevel: 25, spCost: 2200, mpCost: 33, power: 195 },
    { level: 13, requiredLevel: 30, spCost: 4100, mpCost: 35, power: 224 },
    { level: 14, requiredLevel: 30, spCost: 4100, mpCost: 35, power: 234 },
    { level: 15, requiredLevel: 30, spCost: 4100, mpCost: 38, power: 245 },
    { level: 16, requiredLevel: 35, spCost: 6900, mpCost: 40, power: 278 },
    { level: 17, requiredLevel: 35, spCost: 6900, mpCost: 40, power: 289 },
    { level: 18, requiredLevel: 35, spCost: 6900, mpCost: 41, power: 301 },
  ],
};

