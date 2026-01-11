import { SkillDefinition } from "../../../types";

// Sleep - instantly puts target to sleep (continuation for Elven Elder)
// З XML: levels="42", mpConsume: 22-30
// Для Elven Elder: рівні 10-42 (requiredLevel: 40-74)
export const skill_1069: SkillDefinition = {
  id: 1069,
  code: "EE_1069",
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
    { stat: "sleepResist", mode: "multiplier", multiplier: 0, resistStat: "wit" },
  ],
  levels: [
    { level: 10, requiredLevel: 40, spCost: 11000, mpCost: 34, power: 0 },
    { level: 11, requiredLevel: 40, spCost: 11000, mpCost: 34, power: 0 },
    { level: 12, requiredLevel: 40, spCost: 11000, mpCost: 35, power: 0 },
    { level: 13, requiredLevel: 44, spCost: 14000, mpCost: 38, power: 0 },
    { level: 14, requiredLevel: 44, spCost: 14000, mpCost: 38, power: 0 },
    { level: 15, requiredLevel: 44, spCost: 14000, mpCost: 39, power: 0 },
    { level: 16, requiredLevel: 48, spCost: 22000, mpCost: 42, power: 0 },
    { level: 17, requiredLevel: 48, spCost: 22000, mpCost: 43, power: 0 },
    { level: 18, requiredLevel: 48, spCost: 22000, mpCost: 44, power: 0 },
    { level: 19, requiredLevel: 52, spCost: 33000, mpCost: 45, power: 0 },
    { level: 20, requiredLevel: 52, spCost: 33000, mpCost: 47, power: 0 },
    { level: 21, requiredLevel: 52, spCost: 33000, mpCost: 48, power: 0 },
    { level: 22, requiredLevel: 56, spCost: 35000, mpCost: 49, power: 0 },
    { level: 23, requiredLevel: 56, spCost: 35000, mpCost: 50, power: 0 },
    { level: 24, requiredLevel: 56, spCost: 35000, mpCost: 52, power: 0 },
    { level: 25, requiredLevel: 58, spCost: 79000, mpCost: 53, power: 0 },
    { level: 26, requiredLevel: 58, spCost: 79000, mpCost: 54, power: 0 },
    { level: 27, requiredLevel: 60, spCost: 110000, mpCost: 55, power: 0 },
    { level: 28, requiredLevel: 60, spCost: 110000, mpCost: 55, power: 0 },
    { level: 29, requiredLevel: 62, spCost: 150000, mpCost: 57, power: 0 },
    { level: 30, requiredLevel: 62, spCost: 150000, mpCost: 58, power: 0 },
    { level: 31, requiredLevel: 64, spCost: 170000, mpCost: 59, power: 0 },
    { level: 32, requiredLevel: 64, spCost: 170000, mpCost: 60, power: 0 },
    { level: 33, requiredLevel: 66, spCost: 250000, mpCost: 60, power: 0 },
    { level: 34, requiredLevel: 66, spCost: 250000, mpCost: 62, power: 0 },
    { level: 35, requiredLevel: 68, spCost: 300000, mpCost: 63, power: 0 },
    { level: 36, requiredLevel: 68, spCost: 300000, mpCost: 64, power: 0 },
    { level: 37, requiredLevel: 70, spCost: 360000, mpCost: 64, power: 0 },
    { level: 38, requiredLevel: 70, spCost: 360000, mpCost: 65, power: 0 },
    { level: 39, requiredLevel: 72, spCost: 540000, mpCost: 67, power: 0 },
    { level: 40, requiredLevel: 72, spCost: 540000, mpCost: 67, power: 0 },
    { level: 41, requiredLevel: 74, spCost: 820000, mpCost: 68, power: 0 },
    { level: 42, requiredLevel: 74, spCost: 820000, mpCost: 69, power: 0 },
  ],
};













