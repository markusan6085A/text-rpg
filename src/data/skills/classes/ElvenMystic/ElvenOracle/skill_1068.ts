import { SkillDefinition } from "../../../types";

// Might - temporarily increases P. Atk.
// З XML: levels="3", mpConsume: 8-28, pAtk: 1.1-1.16
// Для Elven Oracle: рівень 2 (requiredLevel: 20)
export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "EO_1068",
  name: "Might",
  description: "Temporarily increases P. Atk. Effect 1.\n\nВременно увеличивает физическую атаку на 10-16% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1068.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "pAtk", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 20, spCost: 3300, mpCost: 16, power: 10 },
  ],
};

