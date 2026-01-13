import { SkillDefinition } from "../../../types";

// Ultimate Defense для HumanKnight
export const skill_0110: SkillDefinition = {
  id: 110,
  code: "HK_0110",
  name: "Ultimate Defense",
  description: "Instantly increases P. Def. and M. Def. significantly. User must remain still while it is in effect.\n\nМгновенно значительно увеличивает физ. защиту на 1800-3600 и маг. защиту на 1350-2700 (зависит от уровня) на 30 сек. Делает неуязвимым. Делает неподвижным на время действия. Каст: 1 сек. Перезарядка: 30 мин.",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  icon: "/skills/skill0110.gif",
  effects: [
    { stat: "pDef", mode: "flat", value: 1800 },
    { stat: "mDef", mode: "flat", value: 1350 },
    { stat: "invulnerable", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4700, mpCost: 19, power: 1800 },
    { level: 2, requiredLevel: 40, spCost: 50000, mpCost: 21, power: 3600 },
  ],
};


