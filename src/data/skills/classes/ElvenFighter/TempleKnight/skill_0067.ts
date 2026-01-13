import { SkillDefinition } from "../../../types";

// Summon Life Cubic - summons Life Cubic that recovers master's HP
export const skill_0067: SkillDefinition = {
  id: 67,
  code: "TK_0067",
  name: "Summon Life Cubic",
  description: "Summons Life Cubic. Life Cubic uses magic that recovers master's HP. Requires 6 Crystals: D-Grade.\n\nПризывает кубик, восстанавливающий HP, 1 уровень. Потребляет 6 шт. ? Crystal: D-Grade.",
  icon: "/skills/skill0067.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  duration: 0, // Permanent until dismissed
  levels: [
    { level: 1, requiredLevel: 43, spCost: 35000, mpCost: 38, power: 0 },
    { level: 2, requiredLevel: 49, spCost: 82000, mpCost: 44, power: 0 },
    { level: 3, requiredLevel: 55, spCost: 180000, mpCost: 50, power: 0 },
    { level: 4, requiredLevel: 60, spCost: 220000, mpCost: 55, power: 0 },
    { level: 5, requiredLevel: 64, spCost: 370000, mpCost: 60, power: 0 },
    { level: 6, requiredLevel: 68, spCost: 650000, mpCost: 64, power: 0 },
    { level: 7, requiredLevel: 72, spCost: 1200000, mpCost: 67, power: 0 },
  ],
};

