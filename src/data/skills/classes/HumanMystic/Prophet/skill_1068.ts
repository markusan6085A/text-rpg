import { SkillDefinition } from "../../../types";

export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "HM_1068",
  name: "Might",
  description: "Temporarily increases P. Atk. Effect 3.\n\nВременно увеличивает физическую атаку. Эффект 3.",
  icon: "/skills/skill1068.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "pAtk",
      mode: "percent"
    }
  ],
  stackType: "might",
  stackOrder: 1,
  levels: [
    {
      level: 3,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 20
    }
  ]
};

