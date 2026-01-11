import { SkillDefinition } from "../../../types";

export const skill_1035: SkillDefinition = {
  id: 1035,
  code: "HM_1035",
  name: "Mental Shield",
  description: "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks. Enchant Time: the duration of one's skill usage is increased. Effect 1.\n\nВременно увеличивает сопротивление к Hold, Sleep, Fear и ментальным атакам. Эффект 1. Длительность: 20 мин.",
  icon: "/skills/skill1035.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "holdResist", mode: "multiplier", value: 0.8 },
    { stat: "sleepResist", mode: "multiplier", value: 0.8 },
    { stat: "fearResist", mode: "multiplier", value: 0.8 },
    { stat: "mentalResist", mode: "multiplier", value: 0.8 },
  ],
  stackType: "MentalShield",
  stackOrder: 20,
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6900, mpCost: 23, power: 0.8 },
  ],
};

