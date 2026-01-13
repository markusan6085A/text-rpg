import { SkillDefinition } from "../../../types";

// Surrender To Earth - instantly decreases enemy's resistance to earth attacks
export const skill_1231: SkillDefinition = {
  id: 1231,
  code: "EW_1231",
  name: "Surrender To Earth",
  description: "Instantly decreases enemy's resistance to earth attacks. Effect 2.\n\nУменьшает сопротивление к атакам землей на 25% на 10 сек. с базовым шансом 80% (прохождение зависит от WIT стата). Кастуется только на врагов, действует в пределах дальности 750. Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/skill1231.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 10,
  castTime: 1.5,
  cooldown: 8,
  chance: 80,
  effects: [
    { stat: "earthResist", mode: "percent", value: -25, resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 15, power: 0 },
  ],
};

