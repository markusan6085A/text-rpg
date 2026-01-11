import { SkillDefinition } from "../../../types";

// Recharge - regenerates MP
// З XML: levels="32", mpConsume: 39-109, power: 49-136
// Для Elven Oracle: рівні 1-4 (requiredLevel: 30-35)
export const skill_1013: SkillDefinition = {
  id: 1013,
  code: "EO_1013",
  name: "Recharge",
  description: "Regenerates MP. Cannot be used on a class that has Recharge. Power 49.\n\nВосстанавливает MP. Сила: 49-60 (зависит от уровня). Нельзя использовать на классах, которые имеют Recharge. Каст: 6 сек. Перезарядка: 12 сек.",
  icon: "/skills/skill1013.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 12,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 30, spCost: 6200, mpCost: 39, power: 49 },
    { level: 2, requiredLevel: 30, spCost: 6200, mpCost: 42, power: 52 },
    { level: 3, requiredLevel: 35, spCost: 10000, mpCost: 57, power: 57 },
    { level: 4, requiredLevel: 35, spCost: 10000, mpCost: 60, power: 60 },
  ],
};

