import { SkillDefinition } from "../../../types";

// Heal (levels 7-18 for Shillien Oracle)
export const skill_1011: SkillDefinition = {
  id: 1011,
  code: "DMO_1011",
  name: "Heal",
  description: "Recovers HP. Dark Elf Oracle progression (20-35).\n\nВосстанавливает HP. Прогрессия Темного Эльфа Оракула (20-35).",
  icon: "/skills/Skill1011_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [
    { level: 7, requiredLevel: 20, spCost: 1100, mpCost: 24, power: 121 },
    { level: 8, requiredLevel: 20, spCost: 1100, mpCost: 27, power: 135 },
    { level: 9, requiredLevel: 20, spCost: 1100, mpCost: 30, power: 151 },
    { level: 10, requiredLevel: 25, spCost: 2300, mpCost: 33, power: 176 },
    { level: 11, requiredLevel: 25, spCost: 2300, mpCost: 35, power: 185 },
    { level: 12, requiredLevel: 25, spCost: 2300, mpCost: 37, power: 195 },
    { level: 13, requiredLevel: 30, spCost: 4400, mpCost: 42, power: 224 },
    { level: 14, requiredLevel: 30, spCost: 4400, mpCost: 44, power: 234 },
    { level: 15, requiredLevel: 30, spCost: 4400, mpCost: 44, power: 245 },
    { level: 16, requiredLevel: 35, spCost: 7300, mpCost: 48, power: 278 },
    { level: 17, requiredLevel: 35, spCost: 7300, mpCost: 50, power: 289 },
    { level: 18, requiredLevel: 35, spCost: 7300, mpCost: 52, power: 301 },
  ],
};

