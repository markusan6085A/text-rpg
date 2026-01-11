import { SkillDefinition } from "../../../types";

// Wind Walk - temporarily increases Speed
// З XML: levels="2", mpConsume: 16-21, runSpd: 20-33
// Для Elven Oracle: рівні 1-2 (requiredLevel: 20, 30)
export const skill_1204: SkillDefinition = {
  id: 1204,
  code: "EO_1204",
  name: "Wind Walk",
  description: "Temporarily increases Speed. Effect 1.\n\nВременно увеличивает скорость передвижения. Увеличивает скорость передвижения на 20-33 (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1204.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "runSpeed", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 16, power: 20 },
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 21, power: 33 },
  ],
};
