import { SkillDefinition } from "../../../types";

// Wind Shackle - spirit of the Wind attacks, reducing target's Atk. Spd. (continuation for Elven Elder)
// З XML: levels="19", mpConsume: 2-55, pAtkSpd: 0.83-0.77 (зменшує на 17-23%)
// Для Elven Elder: рівні 6-19 (requiredLevel: 40-74)
export const skill_1206: SkillDefinition = {
  id: 1206,
  code: "EE_1206",
  name: "Wind Shackle",
  description: "Spirit of the Wind attacks, reducing target's Atk. Spd. Effect 3.\n\nАтака духом ветра, снижает скорость атаки цели на 23% на 15 сек. Шанс 80% (зависит от WIT стата). Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/skill1206.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 15,
  castTime: 1.5,
  cooldown: 8,
  chance: 80,
  effects: [
    { stat: "attackSpeed", mode: "percent", value: -23, resistStat: "wit" },
  ],
  levels: [
    { level: 6, requiredLevel: 40, spCost: 34000, mpCost: 35, power: 0 },
    { level: 7, requiredLevel: 44, spCost: 41000, mpCost: 39, power: 0 },
    { level: 8, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 0 },
    { level: 9, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 0 },
    { level: 10, requiredLevel: 56, spCost: 110000, mpCost: 52, power: 0 },
    { level: 11, requiredLevel: 58, spCost: 160000, mpCost: 54, power: 0 },
    { level: 12, requiredLevel: 60, spCost: 210000, mpCost: 55, power: 0 },
    { level: 13, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 0 },
    { level: 14, requiredLevel: 64, spCost: 340000, mpCost: 60, power: 0 },
    { level: 15, requiredLevel: 66, spCost: 500000, mpCost: 62, power: 0 },
    { level: 16, requiredLevel: 68, spCost: 590000, mpCost: 64, power: 0 },
    { level: 17, requiredLevel: 70, spCost: 720000, mpCost: 65, power: 0 },
    { level: 18, requiredLevel: 72, spCost: 1100000, mpCost: 67, power: 0 },
    { level: 19, requiredLevel: 74, spCost: 1600000, mpCost: 69, power: 0 },
  ],
};













