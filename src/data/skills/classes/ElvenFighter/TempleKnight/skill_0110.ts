import { SkillDefinition } from "../../../types";

// Ultimate Defense - continuation from Elven Knight (lv.2)
export const skill_0110: SkillDefinition = {
  id: 110,
  code: "TK_0110",
  name: "Ultimate Defense",
  description: "Instantly increases P. Def. and M. Def. significantly. User must remain still while it is in effect. Power 2.\n\nМгновенно увеличивает физическую защиту на 3600 и магическую защиту на 2700 на 30 сек. Обездвиживает.",
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
    { stat: "immobile", mode: "flat", value: 1 }, // Makes hero unable to move
  ],
  levels: [
    { level: 2, requiredLevel: 46, spCost: 50000, mpCost: 41, power: 2 },
  ],
};

