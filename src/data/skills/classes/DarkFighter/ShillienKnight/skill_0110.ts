import { SkillDefinition } from "../../../types";

// Ultimate Defense - instantly increases P. Def and M. Def significantly (continuation from Palus Knight)
export const skill_0110: SkillDefinition = {
  id: 110,
  code: "SK_0110",
  name: "Ultimate Defense",
  description: "Instantly increases P. Def. and M. Def. significantly. User must remain still while it is in effect. Power 2.\n\nМгновенно значительно увеличивает физическую и магическую защиту. Пользователь должен оставаться неподвижным во время действия. Сила 2.",
  icon: "/skills/skill0110.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    { stat: "pDef", mode: "flat", value: 3600 },
    { stat: "mDef", mode: "flat", value: 2700 },
  ],
  levels: [
    { level: 2, requiredLevel: 49, spCost: 40000, mpCost: 41, power: 2 },
  ],
};

