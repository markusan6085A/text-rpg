import { SkillDefinition } from "../../../types";

export const skill_1033: SkillDefinition = {
  id: 1033,
  code: "HM_1033",
  name: "Resist Poison",
  description: "Temporarily increases resistance to poison. Effect 1.\n\nВременно увеличивает сопротивление яду. Эффект 1.",
  icon: "/skills/skill1033.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "poisonResist",
      mode: "percent",
      value: 20
    }
  ],
  stackType: "resist_poison",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 60,
      spCost: 270000,
      mpCost: 30,
      power: 0.7
    },
    {
      level: 2,
      requiredLevel: 64,
      spCost: 480000,
      mpCost: 35,
      power: 0.6
    },
    {
      level: 3,
      requiredLevel: 68,
      spCost: 770000,
      mpCost: 39,
      power: 0.5
    }
  ]
};

