import { SkillDefinition } from "../../../types";

export const skill_1240: SkillDefinition = {
  id: 1240,
  code: "HM_1240",
  name: "Guidance",
  description: "Temporarily increases Accuracy. Effect 1.\n\nВременно увеличивает точность. Эффект 1.",
  icon: "/skills/skill1240.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "accuracy",
      mode: "flat",
      value: 4
    }
  ],
  stackType: "guidance",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 4
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 4
    },
    {
      level: 3,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 4
    }
  ]
};

