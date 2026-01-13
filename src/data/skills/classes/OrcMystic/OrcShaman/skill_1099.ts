import { SkillDefinition } from "../../../types";

// Seal of Slow - debuff skill that temporarily decreases Speed of nearby enemies
export const skill_1099: SkillDefinition = {
  id: 1099,
  code: "OS_1099",
  name: "Seal of Slow",
  description: "Temporarily decreases Speed of nearby enemies. Effect 2.\n\nВременно уменьшает скорость ближайших врагов на 30%.",
  icon: "/skills/skill1099.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 2,
  chance: 40,
  stackType: "seal_slow", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "runSpeed", mode: "percent", value: -30 },
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 18000, mpCost: 45, power: 30 },
  ],
};

