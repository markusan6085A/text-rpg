import { SkillDefinition } from "../../../types";

// Sleep - instantly puts target to sleep
// З XML: levels="42", mpConsume: 22-30
// Для Elven Oracle: рівні 1-9 (requiredLevel: 25-35)
export const skill_1069: SkillDefinition = {
  id: 1069,
  code: "EO_1069",
  name: "Sleep",
  description: "Instantly puts target to sleep. If cast on a sleeping target, the spell has no effect.\n\nМгновенно усыпляет цель на 30 сек. с базовым шансом 80% (прохождение зависит от WIT стата). Кастуется только на врагов, действует в пределах дальности 600. Усыпляет цель. Предотвращает получение опыта. Каст: 2.5 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1069.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 30,
  castTime: 2.5,
  cooldown: 6,
  chance: 80,
  effects: [
    { stat: "sleepResist", mode: "multiplier", multiplier: 0, resistStat: "wit" }, // Effectively puts to sleep
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 2200, mpCost: 22, power: 0 },
    { level: 2, requiredLevel: 25, spCost: 2200, mpCost: 22, power: 0 },
    { level: 3, requiredLevel: 25, spCost: 2200, mpCost: 23, power: 0 },
    { level: 4, requiredLevel: 30, spCost: 4100, mpCost: 25, power: 0 },
    { level: 5, requiredLevel: 30, spCost: 4100, mpCost: 27, power: 0 },
    { level: 6, requiredLevel: 30, spCost: 4100, mpCost: 27, power: 0 },
    { level: 7, requiredLevel: 35, spCost: 6900, mpCost: 29, power: 0 },
    { level: 8, requiredLevel: 35, spCost: 6900, mpCost: 30, power: 0 },
    { level: 9, requiredLevel: 35, spCost: 6900, mpCost: 30, power: 0 },
  ],
};

