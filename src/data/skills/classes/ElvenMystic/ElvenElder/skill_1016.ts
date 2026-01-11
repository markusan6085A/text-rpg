import { SkillDefinition } from "../../../types";

// Resurrection - resurrects a corpse (continuation for Elven Elder)
// З XML: levels="9", mpConsume: 47-191, power: 0-70
// Для Elven Elder: рівні 3-7 (requiredLevel: 40-74)
export const skill_1016: SkillDefinition = {
  id: 1016,
  code: "EE_1016",
  name: "Resurrection",
  description: "Resurrects a corpse. In addition, restores about 30% of Exp.\n\nВоскрешает труп. Восстанавливает 30-60% опыта (зависит от уровня). Каст: 6 сек. Перезарядка: 120 сек.",
  icon: "/skills/skill1016.gif",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 120,
  effects: [],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 34000, mpCost: 122, power: 30 },
    { level: 4, requiredLevel: 48, spCost: 67000, mpCost: 152, power: 40 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 180, power: 50 },
    { level: 6, requiredLevel: 64, spCost: 340000, mpCost: 195, power: 55 },
    { level: 7, requiredLevel: 74, spCost: 1600000, mpCost: 207, power: 60 },
  ],
};













