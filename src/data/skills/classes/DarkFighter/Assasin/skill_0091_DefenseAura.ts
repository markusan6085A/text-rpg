import { SkillDefinition } from "../../../types";

// Defense Aura lv.2 - temporarily increases P. Def
export const skill_0091_DefenseAura: SkillDefinition = {
  id: 91,
  code: "AS_0091",
  name: "Defense Aura",
  description: "Temporarily increases P. Def. Effect 2.\n\nВременно увеличивает физическую защиту на 12%.",
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
    { stat: "pDef", mode: "multiplier", multiplier: 1.12 },
  ],
  levels: [
    { level: 2, requiredLevel: 20, spCost: 2800, mpCost: 20, power: 12 }, // Increases P. Def by 12%
  ],
};

