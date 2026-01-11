import { SkillDefinition } from "../../../types";

// Hex - instantly decreases enemy's P. Def
export const skill_0122: SkillDefinition = {
  id: 122,
  code: "SK_0122",
  name: "Hex",
  description: "Instantly decreases enemy's P. Def. Effect 3.\n\nМгновенно снижает физическую защиту врага. Эффект 3.",
  icon: "/skills/skill0122.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.2,
  cooldown: 6,
  duration: 15,
  chance: 80, // Success rate depends on WIT stat
  effects: [
    { stat: "pDef", mode: "percent", value: -23 }, // Reduces P. Def by 23%
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 31000, mpCost: 18, power: 0 },
    { level: 2, requiredLevel: 43, spCost: 32000, mpCost: 19, power: 0 },
    { level: 3, requiredLevel: 46, spCost: 40000, mpCost: 22, power: 0 },
    { level: 4, requiredLevel: 49, spCost: 58000, mpCost: 23, power: 0 },
    { level: 5, requiredLevel: 52, spCost: 94000, mpCost: 24, power: 0 },
    { level: 6, requiredLevel: 55, spCost: 130000, mpCost: 25, power: 0 },
    { level: 7, requiredLevel: 58, spCost: 140000, mpCost: 26, power: 0 },
    { level: 8, requiredLevel: 60, spCost: 180000, mpCost: 28, power: 0 },
    { level: 9, requiredLevel: 62, spCost: 240000, mpCost: 29, power: 0 },
    { level: 10, requiredLevel: 64, spCost: 410000, mpCost: 30, power: 0 },
    { level: 11, requiredLevel: 66, spCost: 410000, mpCost: 32, power: 0 },
    { level: 12, requiredLevel: 68, spCost: 510000, mpCost: 33, power: 0 },
    { level: 13, requiredLevel: 70, spCost: 510000, mpCost: 33, power: 0 },
    { level: 14, requiredLevel: 72, spCost: 880000, mpCost: 34, power: 0 },
    { level: 15, requiredLevel: 74, spCost: 1400000, mpCost: 35, power: 0 },
  ],
};

