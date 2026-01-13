import { SkillDefinition } from "../../../types";

// Shield - temporarily increases P. Def.
// З XML: levels="3", mpConsume: 18-28, pDef: 1.2-1.3
// Для Elven Oracle: рівень 2 (requiredLevel: 25)
export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "EO_1040",
  name: "Shield",
  description: "Temporarily increases P. Def. Effect 1.\n\nВременно увеличивает физическую защиту на 20-30% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1040.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "pDef", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 25, spCost: 6500, mpCost: 23, power: 20 },
  ],
};

