import { SkillDefinition } from "../../../types";

// Resist Poison - temporarily increases resistance to poison (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 24-31, vuln: 0.7-0.5
// Для Elven Elder: рівні 2-3 (requiredLevel: 40, 44)
export const skill_1033: SkillDefinition = {
  id: 1033,
  code: "EE_1033",
  name: "Resist Poison",
  description: "Temporarily increases resistance to poison. Effect 2.\n\nВременно увеличивает сопротивление к яду на 40-50% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1033.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "poisonResist", mode: "percent" },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 34000, mpCost: 35, power: 40 },
    { level: 3, requiredLevel: 44, spCost: 41000, mpCost: 39, power: 50 },
  ],
};













