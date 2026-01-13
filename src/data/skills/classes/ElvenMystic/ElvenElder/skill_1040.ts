import { SkillDefinition } from "../../../types";

// Shield - temporarily increases P. Def. (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 18-28, pDef: 1.2-1.3
// Для Elven Elder: рівень 3 (requiredLevel: 44)
export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "EE_1040",
  name: "Shield",
  description: "Temporarily increases P. Def. Effect 3.\n\nВременно увеличивает физическую защиту на 15%. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1040.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "pDef", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 3, requiredLevel: 44, spCost: 41000, mpCost: 39, power: 15 },
  ],
};













