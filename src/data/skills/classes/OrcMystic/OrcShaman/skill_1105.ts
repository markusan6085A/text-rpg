import { SkillDefinition } from "../../../types";

// Madness - debuff skill that confuses enemy into attacking random targets
export const skill_1105: SkillDefinition = {
  id: 1105,
  code: "OS_1105",
  name: "Madness",
  description: "Throws one's enemy into confusion so that the enemy attacks anyone randomly.\n\nВвергает врага в безумие, заставляя его атаковать случайные цели.",
  icon: "/skills/skill1105.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 40,
  duration: 30,
  chance: 20,
  stackType: "madness", // Unique stackType - higher level Madness replaces lower level
  effects: [
    { stat: "mentalResist", mode: "multiplier", multiplier: 0 }, // Effectively causes confusion
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 20, power: 0 },
    { level: 2, requiredLevel: 25, spCost: 5800, mpCost: 23, power: 0 },
    { level: 3, requiredLevel: 30, spCost: 11000, mpCost: 27, power: 0 },
    { level: 4, requiredLevel: 35, spCost: 18000, mpCost: 30, power: 0 },
  ],
};

