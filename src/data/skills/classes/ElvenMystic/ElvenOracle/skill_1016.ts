import { SkillDefinition } from "../../../types";

// Resurrection - resurrects a corpse
// З XML: levels="9", mpConsume: 47-191, power: 0-70
// Для Elven Oracle: рівні 1-2 (requiredLevel: 20, 30)
export const skill_1016: SkillDefinition = {
  id: 1016,
  code: "EO_1016",
  name: "Resurrection",
  description: "Resurrects a corpse.\n\nВоскрешает труп. Восстанавливает 0-20% опыта (зависит от уровня). Каст: 6 сек. Перезарядка: 120 сек.",
  icon: "/skills/skill1016.gif",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 120,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 47, power: 0 },
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 88, power: 20 },
  ],
};
