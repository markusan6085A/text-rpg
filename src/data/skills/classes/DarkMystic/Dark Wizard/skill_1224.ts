import { SkillDefinition } from "../../../types";

// Surrender To Poison - 17 levels from XML
// poisonVuln multipliers: 1.25, 1.25, 1.25, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3
// mpConsume: 9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
// mpConsume_Init: 3, 3, 3, 7, 8, 9, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14
const surrenderPoisonVuln = [1.25, 1.25, 1.25, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3];
const surrenderPoisonMp = [9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];
const surrenderPoisonMpInit = [3, 3, 3, 7, 8, 9, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14];
const surrenderPoisonMagicLvl = [25, 30, 35, 40, 44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1224: SkillDefinition = {
  id: 1224,
  code: "DW_1224",
  name: "Surrender To Poison",
  description: "Instantly decreases enemy's resistance to poison. Effect 2.\n\nДебафф Surrender To Poison на 10 сек. с базовым шансом 80% (прохождение зависит от MEN цели), кастуется только на врагов, действует в пределах дальности 750: - Уменьшает защиту от яда на 25-30%.",
  icon: "/skills/skill1224.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [{ stat: "poisonResist", mode: "multiplier" }], // Value from level.power (multiplier)
  levels: surrenderPoisonVuln.map((multiplier, index) => ({
    level: index + 1,
    requiredLevel: surrenderPoisonMagicLvl[index],
    spCost: index < 3 ? 5800 : index < 6 ? 11000 : index < 9 ? 18000 : index < 12 ? 30000 : index < 15 ? 50000 : 80000,
    mpCost: surrenderPoisonMpInit[index] + surrenderPoisonMp[index],
    power: multiplier,
  })),
};

