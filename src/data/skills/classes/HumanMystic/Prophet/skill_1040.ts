import { SkillDefinition } from "../../../types";

export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "HM_1040",
  name: "Shield",
  description: "Temporarily increases P. Def. Effect 3.\n\nВременно увеличивает физическую защиту. Эффект 3.",
  icon: "/skills/skill1040.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "pDef",
      mode: "percent"
    }
  ],
  stackType: "shield",
  stackOrder: 1,
  levels: [
    {
      level: 3,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 1.15
    }
  ]
};

