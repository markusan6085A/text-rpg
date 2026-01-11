import { SkillDefinition } from "../../../types";

// Seal of Scourge - debuff skill that temporarily prevents nearby enemies from recovering their HP naturally
export const skill_1247: SkillDefinition = {
  id: 1247,
  code: "OL_1247",
  name: "Seal of Scourge",
  description: "Temporarily prevents nearby enemies from recovering their HP naturally.\n\nВременно предотвращает естественное восстановление HP ближайших врагов на 100%.",
  icon: "/skills/skill1247.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 120, // 2 minutes
  chance: 80,
  stackType: "seal_scourge", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "hpRegen", mode: "multiplier", multiplier: 0 }, // Stops HP regeneration
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 53, power: 0 },
    { level: 2, requiredLevel: 44, spCost: 28000, mpCost: 59, power: 0 },
    { level: 3, requiredLevel: 48, spCost: 40000, mpCost: 65, power: 0 },
    { level: 4, requiredLevel: 52, spCost: 65000, mpCost: 70, power: 0 },
  ],
};

