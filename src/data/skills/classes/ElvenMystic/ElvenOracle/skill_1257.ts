import { SkillDefinition } from "../../../types";

// Decrease Weight - makes body lighter
// З XML: levels="3", mpConsume: 12-19
// Для Elven Oracle: рівень 1 (requiredLevel: 35)
export const skill_1257: SkillDefinition = {
  id: 1257,
  code: "EO_1257",
  name: "Decrease Weight",
  description: "Makes body lighter. Effect 1.\n\nДелает тело легче. Увеличивает весовой лимит на 3000 (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1257.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "maxLoad", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 12, power: 3000 },
  ],
};

