import { SkillDefinition } from "../../../types";

export const skill_1160: SkillDefinition = {
  id: 1160,
  code: "HM_1160",
  name: "Slow",
  description: "Temporarily reduces target's Speed. Effect 2.\n\nВременно уменьшает скорость цели на 30%. Эффект 2. Дебафф Slow на 2 мин. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 600. Каст: 4 сек. Перезарядка: 7 сек.",
  icon: "/skills/skill1160.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 7,
  levels: [
  {
    "level": 1,
    "requiredLevel": 35,
    "spCost": 18000,
    "mpCost": 30,
    "power": 0
  }
]
};
