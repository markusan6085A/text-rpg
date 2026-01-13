import { SkillDefinition } from "../../../types";

// Summon Viper Cubic - summons Viper Cubic that poisons targeted enemy
export const skill_0278: SkillDefinition = {
  id: 278,
  code: "SK_0278",
  name: "Summon Viper Cubic",
  description: "Summons Viper Cubic. Viper Cubic uses magic that poisons a targeted enemy. Requires Crystals: D-Grade.\n\nПризывает Гадючий Кубик. Гадючий Кубик использует магию, которая отравляет цель. Требуются кристаллы: D-Grade.",
  icon: "/skills/skill0278.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  duration: 0, // Permanent until dismissed
  levels: [
    { level: 1, requiredLevel: 58, spCost: 140000, mpCost: 54, power: 0 },
    { level: 2, requiredLevel: 58, spCost: 130000, mpCost: 50, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 180000, mpCost: 55, power: 0 },
    { level: 4, requiredLevel: 66, spCost: 240000, mpCost: 58, power: 0 },
    { level: 5, requiredLevel: 70, spCost: 410000, mpCost: 62, power: 0 },
    { level: 6, requiredLevel: 74, spCost: 880000, mpCost: 67, power: 0 },
  ],
};

