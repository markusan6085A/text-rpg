import { SkillDefinition } from "../../../types";

export const skill_1032: SkillDefinition = {
  id: 1032,
  code: "HM_1032",
  name: "Invigor",
  description: "Temporarily increases resistance to bleeding. Effect 1.\n\nВременно увеличивает сопротивление кровотечению. Эффект 1.",
  icon: "/skills/skill1032.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "bleedResist",
      mode: "percent",
      value: 20
    }
  ],
  stackType: "resist_bleed",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 0.7
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 0.6
    },
    {
      level: 3,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 0.5
    }
  ]
};

