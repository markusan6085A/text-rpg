import { SkillDefinition } from "../../../types";

export const skill_1191: SkillDefinition = {
  id: 1191,
  code: "HM_1191",
  name: "Resist Fire",
  description: "Temporarily increases resistance to attacks by fire. Effect 2.\n\nВременно увеличивает сопротивление к атакам огнем. Эффект 2.",
  icon: "/skills/skill1191.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "castSpeed",
      mode: "percent",
      value: 20
    }
  ],
  stackType: "greater_shield",
  stackOrder: 1,
  levels: [
    {
      level: 2,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 0.85
    },
    {
      level: 3,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 0.77
    }
  ]
};

