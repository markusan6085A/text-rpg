import { SkillDefinition } from "../../../types";

// Ultimate Defense - instantly increases P. Def and M. Def significantly
export const skill_0110: SkillDefinition = {
  id: 110,
  code: "EK_0110",
  name: "Ultimate Defense",
  description: "Instantly increases P. Def. and M. Def. significantly. User must remain still while it is in effect. Power 1.\n\nМгновенно значительно увеличивает физическую и магическую защиту. Пользователь должен оставаться неподвижным во время действия.",
  icon: "/skills/skill0110.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    { stat: "pDef", mode: "flat", value: 1800 },
    { stat: "mDef", mode: "flat", value: 1350 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4100, mpCost: 19, power: 1 },
  ],
};

