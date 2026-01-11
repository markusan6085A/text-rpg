import { SkillDefinition } from "../../../types";

// Decrease Weight - makes body lighter (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 12-19
// Для Elven Elder: рівні 2-3 (requiredLevel: 44, 52)
export const skill_1257: SkillDefinition = {
  id: 1257,
  code: "EE_1257",
  name: "Decrease Weight",
  description: "Makes body lighter. Effect 2.\n\nДелает тело легче. Увеличивает весовой лимит на 6000-9000 (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1257.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "maxLoad", mode: "flat" },
  ],
  levels: [
    { level: 2, requiredLevel: 44, spCost: 41000, mpCost: 20, power: 6000 },
    { level: 3, requiredLevel: 52, spCost: 100000, mpCost: 24, power: 9000 },
  ],
};













