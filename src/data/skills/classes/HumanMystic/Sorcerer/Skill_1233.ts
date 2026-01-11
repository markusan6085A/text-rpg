import { SkillDefinition } from "../../../types";

export const skill_1233: SkillDefinition = {
  id: 1233,
  code: "HM_1233",
  name: "Decay",
  description: "Causes decay in target, continuously reducing enemy's HP. Effect 5. Атака землей на 15 сек. с базовым шансом 70% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 600: - Отнимает у цели по 77 HP раз в 1 сек. Вытесняет или вытесняется следующими баффами / дебаффами...",
  icon: "/skills/skill1233.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
  {
    "level": 1,
    "requiredLevel": 48,
    "spCost": 67000,
    "mpCost": 65,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 56,
    "spCost": 110000,
    "mpCost": 77,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 64,
    "spCost": 300000,
    "mpCost": 89,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 74,
    "spCost": 1300000,
    "mpCost": 103,
    "power": 0
  }
]
};
