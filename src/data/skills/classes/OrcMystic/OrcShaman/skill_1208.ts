import { SkillDefinition } from "../../../types";

// Seal of Binding - debuff skill that holds nearby enemies
export const skill_1208: SkillDefinition = {
  id: 1208,
  code: "OS_1208",
  name: "Seal of Binding",
  description: "Instantaneous hold attack upon nearby enemies. If cast on a held target, the spell has no effect.\n\nМгновенно удерживает ближайших врагов. Если применено на удерживаемую цель, заклинание не действует.",
  icon: "/skills/skill1208.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 30,
  chance: 40,
  stackType: "seal_binding", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "holdResist", mode: "multiplier", multiplier: 0 }, // Effectively holds target
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5800, mpCost: 34, power: 0 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 40, power: 0 },
    { level: 3, requiredLevel: 35, spCost: 18000, mpCost: 45, power: 0 },
  ],
};

