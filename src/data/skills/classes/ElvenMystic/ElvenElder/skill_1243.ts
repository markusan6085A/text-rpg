import { SkillDefinition } from "../../../types";

// Bless Shield - Temporarily increases shield defense rate
// З XML: levels="6", rShld: 1.3-1.8
// Для Elven Elder: рівні 1-6 (requiredLevel: 40-72)
export const skill_1243: SkillDefinition = {
  id: 1243,
  code: "EE_1243",
  name: "Bless Shield",
  description: "Temporarily increases shield defense rate. Effect 1.\n\nВременно увеличивает шанс блока щита на 30-80% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1243.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "rShld", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 34000, mpCost: 35, power: 30 },
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 40 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 52, power: 50 },
    { level: 4, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 60 },
    { level: 5, requiredLevel: 66, spCost: 500000, mpCost: 62, power: 70 },
    { level: 6, requiredLevel: 70, spCost: 720000, mpCost: 65, power: 80 },
  ],
};













