import { SkillDefinition } from "../../../types";

export const skill_1222: SkillDefinition = {
  id: 1222,
  code: "HM_1222",
  name: "Curse Chaos",
  description: "Instantaneous curse that reduces enemy's Accuracy. Effect 2.\n\nМгновенное проклятие, которое уменьшает точность врага. Эффект 2. Дебафф Curse Chaos на 10 сек. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 600: уменьшает Accuracy при атаке на 12. Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/skill1222.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  levels: [
  {
    "level": 1,
    "requiredLevel": 35,
    "spCost": 18000,
    "mpCost": 15,
    "power": 0
  }
]
};
