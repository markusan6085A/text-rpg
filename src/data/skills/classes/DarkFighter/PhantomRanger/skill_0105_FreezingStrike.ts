import { SkillDefinition } from "../../../types";

// Freezing Strike - instantly freezes target area, reduces enemy's Speed (continuation from Assassin lv.3-24)
export const skill_0105_FreezingStrike: SkillDefinition = {
  id: 105,
  code: "PR_0105",
  name: "Freezing Strike",
  description: "Instantly freezes target area. Temporarily reduces enemy's Speed. Effect 2.\n\nМгновенно замораживает область цели. Временно снижает скорость врага на 30%.",
  icon: "/skills/skill0105.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 8,
  duration: 2, // Freeze duration
  chance: 60, // Success rate depends on WIT stat
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7 }, // Reduces speed by 30%
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 16000, mpCost: 18, power: 30 },
    { level: 4, requiredLevel: 40, spCost: 16000, mpCost: 18, power: 31 },
    { level: 5, requiredLevel: 43, spCost: 16000, mpCost: 19, power: 33 },
    { level: 6, requiredLevel: 43, spCost: 16000, mpCost: 19, power: 34 },
    { level: 7, requiredLevel: 46, spCost: 23000, mpCost: 20, power: 36 },
    { level: 8, requiredLevel: 46, spCost: 23000, mpCost: 22, power: 37 },
    { level: 9, requiredLevel: 49, spCost: 38000, mpCost: 23, power: 39 },
    { level: 10, requiredLevel: 49, spCost: 38000, mpCost: 23, power: 40 },
    { level: 11, requiredLevel: 52, spCost: 63000, mpCost: 24, power: 42 },
    { level: 12, requiredLevel: 52, spCost: 63000, mpCost: 24, power: 43 },
    { level: 13, requiredLevel: 55, spCost: 85000, mpCost: 25, power: 45 },
    { level: 14, requiredLevel: 55, spCost: 85000, mpCost: 25, power: 46 },
    { level: 15, requiredLevel: 58, spCost: 92000, mpCost: 27, power: 48 },
    { level: 16, requiredLevel: 58, spCost: 92000, mpCost: 28, power: 49 },
    { level: 17, requiredLevel: 60, spCost: 240000, mpCost: 28, power: 51 },
    { level: 18, requiredLevel: 62, spCost: 310000, mpCost: 29, power: 53 },
    { level: 19, requiredLevel: 64, spCost: 370000, mpCost: 30, power: 56 },
    { level: 20, requiredLevel: 66, spCost: 500000, mpCost: 32, power: 58 },
    { level: 21, requiredLevel: 68, spCost: 600000, mpCost: 33, power: 59 },
    { level: 22, requiredLevel: 70, spCost: 720000, mpCost: 33, power: 61 },
    { level: 23, requiredLevel: 72, spCost: 1200000, mpCost: 34, power: 63 },
    { level: 24, requiredLevel: 74, spCost: 1600000, mpCost: 35, power: 65 },
  ],
};

