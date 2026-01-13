import { SkillDefinition } from "../../../types";

// Regeneration - temporarily increases HP recovery (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 18-28, hp: 1.1-1.3
// Для Elven Elder: рівні 2-3 (requiredLevel: 48, 56)
export const skill_1044: SkillDefinition = {
  id: 1044,
  code: "EE_1044",
  name: "Regeneration",
  description: "Temporarily increases HP recovery. Effect 2.\n\nВременно увеличивает регенерацию HP на 15-20% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1044.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "hpRegen", mode: "multiplier" },
  ],
  levels: [
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 15 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 52, power: 20 },
  ],
};













