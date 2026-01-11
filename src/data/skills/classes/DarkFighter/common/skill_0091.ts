import { SkillDefinition } from "../../../types";

// Defense Aura - temporarily increases P. Def
export const skill_0091: SkillDefinition = {
  id: 91,
  code: "DKF_0091",
  name: "Defense Aura",
  description: "Temporarily increases P. Def.\n\nВременно увеличивает физическую защиту.",
  icon: "/skills/skill0091.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  stackType: "pDef",
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 1.08 },
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 160, mpCost: 10, power: 0 },
  ],
};

