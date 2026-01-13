import { SkillDefinition } from "../../../types";

// Seal of Winter - debuff skill that instantly decreases Atk. Spd. of surrounding enemies
export const skill_1104: SkillDefinition = {
  id: 1104,
  code: "OL_1104",
  name: "Seal of Winter",
  description: "Instantly decreases Atk. Spd. of surrounding enemies. Effect 3.\n\nМгновенно уменьшает скорость атаки окружающих врагов на 23%.",
  icon: "/skills/skill1104.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 40,
  stackType: "seal_winter", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "atkSpeed", mode: "percent", value: -23 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 53, power: -23 },
    { level: 2, requiredLevel: 44, spCost: 28000, mpCost: 59, power: -23 },
    { level: 3, requiredLevel: 48, spCost: 40000, mpCost: 65, power: -23 },
    { level: 4, requiredLevel: 52, spCost: 65000, mpCost: 70, power: -23 },
  ],
};

