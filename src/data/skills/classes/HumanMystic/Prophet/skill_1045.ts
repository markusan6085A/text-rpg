import { SkillDefinition } from "../../../types";

export const skill_1045: SkillDefinition = {
  id: 1045,
  code: "HM_1045",
  name: "Bless the Body",
  description: "Temporarily increases maximum HP. Effect 1.\n\nВременно увеличивает максимальный HP. Эффект 1.",
  icon: "/skills/skill1045.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "maxHp",
      mode: "percent",
      value: 35
    }
  ],
  stackType: "bless_the_body",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 1.35
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 1.35
    },
    {
      level: 3,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 1.35
    },
    {
      level: 4,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 1.35
    },
    {
      level: 5,
      requiredLevel: 64,
      spCost: 480000,
      mpCost: 60,
      power: 1.35
    },
    {
      level: 6,
      requiredLevel: 72,
      spCost: 1700000,
      mpCost: 67,
      power: 1.35
    }
  ]
};

