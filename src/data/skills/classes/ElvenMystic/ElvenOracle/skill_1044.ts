import { SkillDefinition } from "../../../types";

// Regeneration - temporarily increases HP recovery
// З XML: levels="3", mpConsume: 18-28, hp: 1.1-1.3
// Для Elven Oracle: рівень 1 (requiredLevel: 35)
export const skill_1044: SkillDefinition = {
  id: 1044,
  code: "EO_1044",
  name: "Regeneration",
  description: "Temporarily increases HP recovery. Effect 1.\n\nВременно увеличивает регенерацию HP на 10-30% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1044.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "hpRegen", mode: "multiplier" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 18, power: 1.1 },
  ],
};

