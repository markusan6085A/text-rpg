import { SkillDefinition } from "../../../types";

// Slow - 15 levels from XML
// runSpd multipliers: 0.7, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5
// mpConsume: 24, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
// mpConsume_Init: 6, 7, 8, 9, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14
const slowRunSpd = [0.7, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
const slowMp = [24, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];
const slowMpInit = [6, 7, 8, 9, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14];
const slowMagicLvl = [35, 40, 44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1160: SkillDefinition = {
  id: 1160,
  code: "DW_1160",
  name: "Slow",
  description: "Temporarily reduces target's Speed. Effect 2.\n\nДебафф Slow на 2 мин. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 600: - Уменьшает скорость передвижения на 30-50%.",
  icon: "/skills/Skill1160_0.jpg",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 120, // 2 minutes
  chance: 80,
  castTime: 4,
  cooldown: 7,
  effects: [{ stat: "runSpeed", mode: "multiplier" }], // Value from level.power (multiplier)
  levels: slowRunSpd.map((multiplier, index) => ({
    level: index + 1,
    requiredLevel: slowMagicLvl[index],
    spCost: index < 2 ? 18000 : index < 4 ? 30000 : index < 6 ? 50000 : index < 8 ? 80000 : index < 10 ? 120000 : index < 12 ? 160000 : 200000,
    mpCost: slowMpInit[index] + slowMp[index],
    power: multiplier,
  })),
};

