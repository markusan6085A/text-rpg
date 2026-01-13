import { SkillDefinition } from "../../../types";

// Seal of Mirage - debuff skill that throws nearby enemies into chaos
export const skill_1213: SkillDefinition = {
  id: 1213,
  code: "OL_1213",
  name: "Seal of Mirage",
  description: "Throws nearby enemies into chaos, causing them to attack anybody randomly.\n\nВвергает ближайших врагов в хаос, заставляя их атаковать кого угодно случайным образом.",
  icon: "/skills/skill1213.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 30,
  chance: 20, // Chance to land confusion
  stackType: "seal_mirage", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "mentalResist", mode: "multiplier", multiplier: 0 }, // Effectively causes confusion
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 28000, mpCost: 59, power: 20 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 65, power: 20 },
    { level: 3, requiredLevel: 52, spCost: 65000, mpCost: 70, power: 20 },
  ],
};

