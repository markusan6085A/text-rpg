import { SkillDefinition } from "../../../types";

// Curse of Abyss
export const skill_1337: SkillDefinition = {
  id: 1337,
  code: "ST_1337",
  name: "Curse of Abyss",
  description: "Temporarily decreases an enemy's Moving Speed, P. Def., Evasion, M. Atk., Casting Spd, and critical chance of damage magic. Дебафф Curse of Abyss на 2 мин. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 600: - Уменьшает магическую атаку на 30%. - Уменьшает скорость каста на 20%. - Уменьшает вероятность магических критических атак на 30%. - Уменьшает скорость передвижения на 10%. - Уменьшает физическую защиту на 30%. - Уменьшает Evasion на 6.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/skill1337.gif",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 300,
  duration: 120,
  chance: 80,
  effects: [
    { stat: "mAtk", mode: "percent", value: -30 },
    { stat: "castSpeed", mode: "percent", value: -20 },
    { stat: "skillCritRate", mode: "percent", value: -30 },
    { stat: "runSpeed", mode: "percent", value: -10 },
    { stat: "pDef", mode: "percent", value: -30 },
    { stat: "evasion", mode: "flat", value: -6 },
  ],
  levels: [{ level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 72, power: 0 }],
};
