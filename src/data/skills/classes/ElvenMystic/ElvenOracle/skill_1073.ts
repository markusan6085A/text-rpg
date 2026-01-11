import { SkillDefinition } from "../../../types";

// Kiss of Eva - temporarily increases lung capacity
// З XML: levels="2", mpConsume: 20-48, breath: 5-7
// Для Elven Oracle: рівень 1 (requiredLevel: 20)
export const skill_1073: SkillDefinition = {
  id: 1073,
  code: "EO_1073",
  name: "Kiss of Eva",
  description: "Temporarily increases lung capacity. Effect 1.\n\nВременно увеличивает емкость легких. Увеличивает емкость легких на 5 (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1073.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "breathGauge", mode: "multiplier" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 5 },
  ],
};
