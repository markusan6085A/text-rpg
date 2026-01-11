import { SkillDefinition } from "../../../types";

export const skill_1243: SkillDefinition = {
  id: 1243,
  code: "HM_1243",
  name: "Bless Shield",
  description: "Temporarily increases shield defense rate. Effect 1.\n\nВременно увеличивает шанс блокирования щитом. Эффект 1.",
  icon: "/skills/skill1243.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "shieldBlockRate",
      mode: "percent",
      value: 40
    }
  ],
  stackType: "bless_shield",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 1.4
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 1.4
    },
    {
      level: 3,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 1.4
    }
  ]
};

