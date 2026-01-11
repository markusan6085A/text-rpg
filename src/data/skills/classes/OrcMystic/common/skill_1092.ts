import { SkillDefinition } from "../../../types";

// Fear - debuff skill that instills fear into an enemy causing it to flee
export const skill_1092: SkillDefinition = {
  id: 1092,
  code: "OM_1092",
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
    { level: 1, requiredLevel: 14, spCost: 1800, mpCost: 15, power: 0 },
  ],
};

