import { SkillDefinition } from "../../../types";

// Dryad Root - instantly holds an enemy
// З XML: levels="33", mpConsume: 17-55
// Для Elven Oracle: рівні 1-9 (requiredLevel: 25-35)
export const skill_1201: SkillDefinition = {
  id: 1201,
  code: "EO_1201",
  name: "Dryad Root",
  description: "Instantly holds an enemy. The target cannot receive any additional hold attacks while the effect lasts.\n\nМгновенно удерживает врага. Цель не может получить дополнительные атаки удержания, пока действует эффект. Длительность: 30 сек. Шанс: 80% (зависит от WIT стата). Каст: 2.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/skill1201.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 30,
  castTime: 2.5,
  cooldown: 8,
  chance: 80,
  effects: [
    { stat: "holdResist", mode: "multiplier", multiplier: 0, resistStat: "wit" }, // Effectively holds target
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 2200, mpCost: 17, power: 0 },
    { level: 2, requiredLevel: 25, spCost: 2200, mpCost: 17, power: 0 },
    { level: 3, requiredLevel: 25, spCost: 2200, mpCost: 18, power: 0 },
    { level: 4, requiredLevel: 30, spCost: 4100, mpCost: 20, power: 0 },
    { level: 5, requiredLevel: 30, spCost: 4100, mpCost: 21, power: 0 },
    { level: 6, requiredLevel: 30, spCost: 4100, mpCost: 21, power: 0 },
    { level: 7, requiredLevel: 35, spCost: 6900, mpCost: 23, power: 0 },
    { level: 8, requiredLevel: 35, spCost: 6900, mpCost: 24, power: 0 },
    { level: 9, requiredLevel: 35, spCost: 6900, mpCost: 24, power: 0 },
  ],
};
