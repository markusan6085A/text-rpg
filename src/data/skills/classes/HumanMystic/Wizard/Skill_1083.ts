import { SkillDefinition } from "../../../types";

export const skill_1083: SkillDefinition = {
  id: 1083,
  code: "HM_1083",
  name: "Surrender To Fire",
  description: "Instantly decreases enemy's resistance to attacks by fire. Effect 2.\n\nДебафф Surrender To Fire на 10 сек. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 750: - Уменьшает защиту от атак огнем на 25%. Вытесняет или вытесняется следующими баффами / дебаффами...",
  icon: "/skills/skill1083.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  levels: [
  {
    "level": 1,
    "requiredLevel": 25,
    "spCost": 5500,
    "mpCost": 12,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 30,
    "spCost": 11000,
    "mpCost": 14,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 35,
    "spCost": 18000,
    "mpCost": 15,
    "power": 0
  }
]
};
