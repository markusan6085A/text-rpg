import { SkillDefinition } from "../../../types";

// Agility - increases Evasion temporarily
// З XML: levels="3", mpConsume: 23, rEvas: 1.1-1.15
// Для Elven Oracle: рівень 1 (requiredLevel: 25)
export const skill_1087: SkillDefinition = {
  id: 1087,
  code: "EO_1087",
  name: "Agility",
  description: "Increases Evasion temporarily. Effect 1.\n\nВременно увеличивает уклонение на 10-15% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1087.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "evasion", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6500, mpCost: 23, power: 10 },
  ],
};

