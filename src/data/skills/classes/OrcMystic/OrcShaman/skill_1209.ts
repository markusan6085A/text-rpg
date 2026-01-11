import { SkillDefinition } from "../../../types";

// Seal of Poison - debuff skill that instantly poisons nearby enemies
export const skill_1209: SkillDefinition = {
  id: 1209,
  code: "OS_1209",
  name: "Seal of Poison",
  description: "Instantly poisons nearby enemies. Effect 3.\n\nМгновенно отравляет ближайших врагов.",
  icon: "/skills/skill1209.gif",
  category: "debuff",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 15,
  duration: 30,
  chance: 35,
  stackType: "seal_poison", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  hpPerTick: -90, // Damages 90 HP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "poisonResist", mode: "multiplier", multiplier: 0 }, // Effectively poisons target
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 29, power: 90 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 40, power: 120 },
  ],
};

