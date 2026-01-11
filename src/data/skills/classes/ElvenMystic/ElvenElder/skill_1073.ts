import { SkillDefinition } from "../../../types";

// Kiss of Eva - temporarily increases lung capacity (continuation for Elven Elder)
// З XML: levels="2", mpConsume: 20-48, breath: 5-7
// Для Elven Elder: рівень 2 (requiredLevel: 52)
export const skill_1073: SkillDefinition = {
  id: 1073,
  code: "EE_1073",
  name: "Kiss of Eva",
  description: "Temporarily increases lung capacity. Effect 2.\n\nВременно увеличивает емкость легких. Увеличивает емкость легких на 600 единиц. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1073.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "breathGauge", mode: "multiplier", value: 600 },
  ],
  levels: [
    { level: 2, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 600 },
  ],
};













