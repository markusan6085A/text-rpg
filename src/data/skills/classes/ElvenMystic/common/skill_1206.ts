import { SkillDefinition } from "../../../types";

// Wind Shackle - spirit of the Wind attacks, reducing target's Atk. Spd.
export const skill_1206: SkillDefinition = {
  id: 1206,
  code: "EM_1206",
  name: "Wind Shackle",
  description: "Spirit of the Wind attacks, reducing target's Atk. Spd. Effect 1. Lasts for 5 sec with base chance 80% (resistance depends on WIT stat).\n\nАтака духом ветра, снижает скорость атаки цели на 17% на 5 сек. Шанс 80% (зависит от WIT стата). Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/skill1206.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 5,
  castTime: 1.5,
  cooldown: 8,
  chance: 80,
  effects: [
    { stat: "attackSpeed", mode: "percent", value: -17, resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 14, spCost: 2100, mpCost: 3, power: 0 },
  ],
};

