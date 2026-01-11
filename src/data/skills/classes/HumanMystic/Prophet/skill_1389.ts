import { SkillDefinition } from "../../../types";

export const skill_1389: SkillDefinition = {
  id: 1389,
  code: "HM_1389",
  name: "Greater Shield",
  description: "Temporarily increases P. Def. Effect 1.\n\nВременно увеличивает физическую защиту. Эффект 1.",
  icon: "/skills/skill1389.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  stackType: "shield",
  stackOrder: 2,
  levels: [
    {
      level: 1,
      requiredLevel: 66,
      spCost: 700000,
      mpCost: 69,
      power: 5,
    },
    {
      level: 2,
      requiredLevel: 70,
      spCost: 1000000,
      mpCost: 69,
      power: 10,
    },
    {
      level: 3,
      requiredLevel: 74,
      spCost: 1700000,
      mpCost: 69,
      power: 15,
    },
  ],
  effects: [
    {
      stat: "pDef",
      mode: "percent",
    },
  ],
};

