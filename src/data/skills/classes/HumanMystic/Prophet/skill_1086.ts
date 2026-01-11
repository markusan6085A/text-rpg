import { SkillDefinition } from "../../../types";

export const skill_1086: SkillDefinition = {
  id: 1086,
  code: "HM_1086",
  name: "Haste",
  description: "Temporarily increases Atk. Spd. Effect 1.\n\nВременно увеличивает скорость атаки. Эффект 1.",
  icon: "/skills/skill1086.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "attackSpeed",
      mode: "percent",
      value: 33
    }
  ],
  stackType: "haste",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 1.33
    },
    {
      level: 2,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 1.33
    }
  ]
};

