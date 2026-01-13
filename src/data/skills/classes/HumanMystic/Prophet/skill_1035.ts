import { SkillDefinition } from "../../../types";

export const skill_1035: SkillDefinition = {
  id: 1035,
  code: "HM_1035",
  name: "Mental Shield",
  description: "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks. Enchant Time: the duration of one's skill usage is increased. Effect 2.\n\nВременно увеличивает сопротивление к Hold, Sleep, Fear и ментальным атакам. Эффект 2.",
  icon: "/skills/skill1035.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "pAtk",
      mode: "percent",
      value: 15
    }
  ],
  stackType: "mental_shield",
  stackOrder: 1,
  levels: [
    {
      level: 2,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 0.8
    },
    {
      level: 3,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 0.6
    },
    {
      level: 4,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 0.4
    }
  ]
};

