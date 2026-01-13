import { SkillDefinition } from "../../../types";

// Wind Shackle - spirit of the Wind attacks, reducing target's Atk. Spd.
// З XML: levels="19", mpConsume: 2-55, pAtkSpd: 0.83-0.77 (зменшує на 17-23%)
// Для Elven Oracle: рівні 2-5 (requiredLevel: 20-35)
export const skill_1206: SkillDefinition = {
  id: 1206,
  code: "EO_1206",
  name: "Wind Shackle",
  description: "Spirit of the Wind attacks, reducing target's Atk. Spd. Effect 1.\n\nАтака духом ветра, снижает скорость атаки цели на 17-23% на 15 сек. Шанс 80% (зависит от WIT стата). Каст: 1.5 сек. Перезарядка: 8 сек.",
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
    { stat: "attackSpeed", mode: "percent", value: -17, resistStat: "wit" },
  ],
  levels: [
    { level: 2, requiredLevel: 20, spCost: 3300, mpCost: 8, power: 0 },
    { level: 3, requiredLevel: 25, spCost: 6500, mpCost: 9, power: 0 },
    { level: 4, requiredLevel: 30, spCost: 12000, mpCost: 11, power: 0 },
    { level: 5, requiredLevel: 35, spCost: 21000, mpCost: 12, power: 0 },
  ],
};
