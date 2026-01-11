import { SkillDefinition } from "../../../types";

export const skill_1077: SkillDefinition = {
  id: 1077,
  code: "HM_1077",
  name: "Focus",
  description: "Temporarily increases critical attack rate. Effect 2.\n\nВременно увеличивает шанс критической атаки. Эффект 2.",
  icon: "/skills/skill1077.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "critRate",
      mode: "percent"
    }
  ],
  stackType: "focus",
  stackOrder: 1,
  levels: [
    {
      level: 2,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 20
    },
    {
      level: 3,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 20
    }
  ]
};

