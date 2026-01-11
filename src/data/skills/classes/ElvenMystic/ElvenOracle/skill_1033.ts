import { SkillDefinition } from "../../../types";

// Resist Poison - temporarily increases resistance to poison
// З XML: levels="3", mpConsume: 24-31, vuln: 0.7-0.5
// Для Elven Oracle: рівень 1 (requiredLevel: 35)
export const skill_1033: SkillDefinition = {
  id: 1033,
  code: "EO_1033",
  name: "Resist Poison",
  description: "Temporarily increases resistance to poison. Effect 1.\n\nВременно увеличивает сопротивление к яду на 30-50% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1033.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "poisonResist", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 24, power: 30 },
  ],
};

