import { SkillDefinition } from "../../../types";

export const skill_1048: SkillDefinition = {
  id: 1048,
  code: "HM_1048",
  name: "Bless the Soul",
  description: "Temporarily increases maximum MP. Effect 1.\n\nВременно увеличивает максимальный MP. Эффект 1.",
  icon: "/skills/skill1048.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "maxMp",
      mode: "percent",
      value: 30
    }
  ],
  stackType: "bless_the_soul",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 1.3
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 1.3
    },
    {
      level: 3,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 1.3
    },
    {
      level: 4,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 1.3
    },
    {
      level: 5,
      requiredLevel: 62,
      spCost: 360000,
      mpCost: 58,
      power: 1.3
    },
    {
      level: 6,
      requiredLevel: 70,
      spCost: 1000000,
      mpCost: 65,
      power: 1.3
    }
  ]
};

