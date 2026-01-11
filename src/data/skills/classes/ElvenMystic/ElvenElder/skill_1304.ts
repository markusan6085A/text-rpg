import { SkillDefinition } from "../../../types";

// Advanced Block - Temporarily increases shield defense rate
// З XML: levels="3", sDef: 1.6-2.0
// Для Elven Elder: рівні 1-3 (requiredLevel: 58-72)
export const skill_1304: SkillDefinition = {
  id: 1304,
  code: "EE_1304",
  name: "Advanced Block",
  description: "Temporarily increases shield defense rate. Effect 1.\n\nВременно увеличивает защиту щита на 60-100% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1304.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "sDef", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 160000, mpCost: 54, power: 60 },
    { level: 2, requiredLevel: 66, spCost: 500000, mpCost: 62, power: 80 },
    { level: 3, requiredLevel: 72, spCost: 1100000, mpCost: 67, power: 100 },
  ],
};













