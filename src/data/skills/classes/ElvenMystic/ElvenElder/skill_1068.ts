import { SkillDefinition } from "../../../types";

// Might - temporarily increases P. Atk. (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 8-28, pAtk: 1.1-1.16
// Для Elven Elder: рівень 3 (requiredLevel: 40)
export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "EE_1068",
  name: "Might",
  description: "Temporarily increases P. Atk. Effect 3.\n\nВременно увеличивает физическую атаку на 15%. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1068.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "pAtk", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 34000, mpCost: 35, power: 15 },
  ],
};













