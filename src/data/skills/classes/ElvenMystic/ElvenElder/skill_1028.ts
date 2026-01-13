import { SkillDefinition } from "../../../types";

// Might of Heaven - Inflicts damage to undead monsters
// З XML: levels="19", power: 39-87
// Для Elven Elder: рівні 1-19 (requiredLevel: 40-74)
export const skill_1028: SkillDefinition = {
  id: 1028,
  code: "EE_1028",
  name: "Might of Heaven",
  description: "Inflicts damage to undead monsters. Power 39.\n\nАтакует нежить светом. Сила: 39-87 (зависит от уровня). Каст: 2.5 сек. Перезарядка: 4 сек.",
  icon: "/skills/skill1028.gif",
  category: "magic_attack",
  powerType: "flat",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 4,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 17000, mpCost: 34, power: 39 },
    { level: 2, requiredLevel: 40, spCost: 17000, mpCost: 35, power: 42 },
    { level: 3, requiredLevel: 44, spCost: 21000, mpCost: 38, power: 44 },
    { level: 4, requiredLevel: 44, spCost: 21000, mpCost: 39, power: 47 },
    { level: 5, requiredLevel: 48, spCost: 33000, mpCost: 42, power: 49 },
    { level: 6, requiredLevel: 48, spCost: 33000, mpCost: 44, power: 52 },
    { level: 7, requiredLevel: 52, spCost: 50000, mpCost: 45, power: 55 },
    { level: 8, requiredLevel: 52, spCost: 50000, mpCost: 48, power: 57 },
    { level: 9, requiredLevel: 56, spCost: 53000, mpCost: 49, power: 60 },
    { level: 10, requiredLevel: 56, spCost: 53000, mpCost: 52, power: 63 },
    { level: 11, requiredLevel: 58, spCost: 160000, mpCost: 54, power: 66 },
    { level: 12, requiredLevel: 60, spCost: 210000, mpCost: 55, power: 68 },
    { level: 13, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 71 },
    { level: 14, requiredLevel: 64, spCost: 340000, mpCost: 60, power: 74 },
    { level: 15, requiredLevel: 66, spCost: 500000, mpCost: 62, power: 77 },
    { level: 16, requiredLevel: 68, spCost: 590000, mpCost: 64, power: 79 },
    { level: 17, requiredLevel: 70, spCost: 720000, mpCost: 65, power: 82 },
    { level: 18, requiredLevel: 72, spCost: 1100000, mpCost: 67, power: 84 },
    { level: 19, requiredLevel: 74, spCost: 1600000, mpCost: 69, power: 87 },
  ],
};













