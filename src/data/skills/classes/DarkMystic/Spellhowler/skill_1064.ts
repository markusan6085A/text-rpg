import { SkillDefinition } from "../../../types";

// Silence - 14 levels from XML
const mpConsumeInitValues = [7, 8, 9, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14];
const mpConsumeValues = [28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];
const magicLvlValues = [40, 44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1064: SkillDefinition = {
  id: 1064,
  code: "SP_1064",
  name: "Silence",
  description: "Temporarily blocks the enemy's magic skills.\n\nВременно блокирует магические скілы врага на 30 сек. с базовым шансом 80%.",
  icon: "/skills/skill1064.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 7,
  cooldown: 60,
  duration: 30,
  chance: 80,
  effects: [{ stat: "castSpeed", mode: "percent", value: -100 }], // Blocks magic skills
  levels: mpConsumeValues.map((mp, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 32000 : index < 4 ? 55000 : index < 6 ? 100000 : index < 8 ? 180000 : index < 10 ? 300000 : index < 12 ? 610000 : 920000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power: 0,
  })),
};

