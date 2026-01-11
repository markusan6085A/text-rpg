import { SkillDefinition } from "../../../types";

export const skill_1182: SkillDefinition = {
  id: 1182,
  code: "HM_1182",
  name: "Resist Aqua",
  description: "Temporarily increases tolerance to attack by water. Effect 1.\n\nВременно увеличивает сопротивление к атакам водой. Эффект 1.",
  icon: "/skills/skill1182.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "waterResist",
      mode: "flat",
      value: 30
    }
  ],
  stackType: "resist_aqua",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 58,
      spCost: 220000,
      mpCost: 23,
      power: 0.85
    },
    {
      level: 2,
      requiredLevel: 62,
      spCost: 360000,
      mpCost: 35,
      power: 0.77
    },
    {
      level: 3,
      requiredLevel: 66,
      spCost: 700000,
      mpCost: 39,
      power: 0.7
    }
  ]
};

