import { SkillDefinition } from "../../../types";

// Agility - increases Evasion temporarily (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 23, rEvas: 1.1-1.15
// Для Elven Elder: рівні 2-3 (requiredLevel: 44, 52)
export const skill_1087: SkillDefinition = {
  id: 1087,
  code: "EE_1087",
  name: "Agility",
  description: "Increases Evasion temporarily. Effect 2.\n\nВременно увеличивает уклонение на 3-4 (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1087.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "evasion", mode: "flat" },
  ],
  levels: [
    { level: 2, requiredLevel: 44, spCost: 41000, mpCost: 39, power: 3 },
    { level: 3, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 4 },
  ],
};













