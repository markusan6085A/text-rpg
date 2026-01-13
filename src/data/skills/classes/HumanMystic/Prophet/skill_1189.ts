import { SkillDefinition } from "../../../types";

export const skill_1189: SkillDefinition = {
  id: 1189,
  code: "HM_1189",
  name: "Resist Wind",
  description: "Temporarily increases resistance to attack by wind. Effect 1.\n\nВременно увеличивает сопротивление к атакам ветром. Эффект 1.",
  icon: "/skills/skill1189.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "windResist",
      mode: "flat",
      value: 30
    }
  ],
  stackType: "resist_wind",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 58,
      spCost: 220000,
      mpCost: 30,
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

