import { SkillDefinition } from "../../../types";

// Surrender To Wind - 14 levels from XML
const mpConsumeInitValues = [7, 8, 9, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14];
const mpConsumeValues = [28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];
const magicLvlValues = [40, 44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1074: SkillDefinition = {
  id: 1074,
  code: "SP_1074",
  name: "Surrender To Wind",
  description: "Temporarily decreases target's Wind Resistance.\n\nВременно снижает сопротивление цели к атакам ветром на 30% на 15 сек. с базовым шансом 80%.",
  icon: "/skills/skill1074.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [{ stat: "windResist", mode: "multiplier", multiplier: 0.7 }], // -30% wind resistance
  levels: mpConsumeValues.map((mp, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 34000 : index < 4 ? 67000 : index < 6 ? 110000 : index < 8 ? 180000 : index < 10 ? 300000 : index < 12 ? 410000 : 1300000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power: 0.7, // Store multiplier in power
  })),
};

