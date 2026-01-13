import { SkillDefinition } from "../../../types";

// Life Leech - absorbs enemy's HP
export const skill_0289: SkillDefinition = {
  id: 289,
  code: "SK_0289",
  name: "Life Leech",
  description: "Absorbs an enemy's HP.\n\nПоглощает HP врага.",
  icon: "/skills/skill0289.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 15,
  duration: 600, // 600 seconds
  effects: [
    { stat: "vampirism", mode: "percent", value: 80 }, // 80% of damage absorbed as HP
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 31000, mpCost: 27, power: 26 },
    { level: 2, requiredLevel: 43, spCost: 32000, mpCost: 29, power: 29 },
    { level: 3, requiredLevel: 46, spCost: 40000, mpCost: 32, power: 32 },
    { level: 4, requiredLevel: 49, spCost: 58000, mpCost: 34, power: 33 },
    { level: 5, requiredLevel: 52, spCost: 94000, mpCost: 36, power: 36 },
    { level: 6, requiredLevel: 55, spCost: 130000, mpCost: 38, power: 39 },
    { level: 7, requiredLevel: 58, spCost: 140000, mpCost: 40, power: 41 },
    { level: 8, requiredLevel: 60, spCost: 180000, mpCost: 42, power: 43 },
    { level: 9, requiredLevel: 62, spCost: 240000, mpCost: 44, power: 45 },
    { level: 10, requiredLevel: 64, spCost: 410000, mpCost: 45, power: 47 },
    { level: 11, requiredLevel: 66, spCost: 410000, mpCost: 47, power: 48 },
    { level: 12, requiredLevel: 68, spCost: 510000, mpCost: 48, power: 50 },
    { level: 13, requiredLevel: 70, spCost: 510000, mpCost: 49, power: 51 },
    { level: 14, requiredLevel: 72, spCost: 880000, mpCost: 50, power: 53 },
    { level: 15, requiredLevel: 74, spCost: 1400000, mpCost: 52, power: 54 },
  ],
};

