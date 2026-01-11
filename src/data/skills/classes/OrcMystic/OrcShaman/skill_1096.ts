import { SkillDefinition } from "../../../types";

// Seal of Chaos - debuff skill that decreases Accuracy of nearby enemies
export const skill_1096: SkillDefinition = {
  id: 1096,
  code: "OS_1096",
  name: "Seal of Chaos",
  description: "Instantly decreases Accuracy of nearby enemies. Effect 2.\n\nМгновенно уменьшает точность ближайших врагов.",
  icon: "/skills/skill1096.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 1.5,
  cooldown: 8,
  duration: 10,
  chance: 40,
  stackType: "seal_chaos", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "accuracy", mode: "flat", value: -12 },
  ],
  levels: [
    { level: 1, requiredLevel: 30, spCost: 11000, mpCost: 20, power: 12 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 23, power: 12 },
  ],
};

