import { SkillDefinition } from "../../../types";

// Seal of Silence - debuff skill that temporarily blocks nearby enemies from using their magic skills
export const skill_1246: SkillDefinition = {
  id: 1246,
  code: "OL_1246",
  name: "Seal of Silence",
  description: "Temporarily blocks nearby enemies from using their magic skills.\n\nВременно блокирует ближайших врагов от использования магических навыков.",
  icon: "/skills/skill1246.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 120, // 2 minutes
  chance: 40,
  stackType: "seal_silence", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "debuffResist", mode: "multiplier", multiplier: 0 }, // Effectively silences (blocks magic skills)
  ],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 40000, mpCost: 65, power: 0 },
    { level: 2, requiredLevel: 52, spCost: 65000, mpCost: 70, power: 0 },
  ],
};

