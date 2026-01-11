import { SkillDefinition } from "../../../types";

// Fear - debuff skill (Levels 2-5 for OrcShaman)
export const skill_1092: SkillDefinition = {
  id: 1092,
  code: "OS_1092",
  name: "Fear",
  description: "Instills fear into an enemy causing it to flee.\n\nВселяет страх во врага, заставляя его бежать.",
  icon: "/skills/skill1092.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 20,
  duration: 30,
  chance: 30,
  stackType: "fear", // Unique stackType - higher level Fear replaces lower level
  effects: [
    { stat: "fearResist", mode: "multiplier", multiplier: 0 }, // Effectively causes fear
  ],
  levels: [
    { level: 2, requiredLevel: 20, spCost: 2900, mpCost: 20, power: 0 },
    { level: 3, requiredLevel: 25, spCost: 5800, mpCost: 23, power: 0 },
    { level: 4, requiredLevel: 30, spCost: 11000, mpCost: 27, power: 0 },
    { level: 5, requiredLevel: 35, spCost: 18000, mpCost: 30, power: 0 },
  ],
};

