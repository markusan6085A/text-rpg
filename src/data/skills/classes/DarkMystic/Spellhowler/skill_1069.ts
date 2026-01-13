import { SkillDefinition } from "../../../types";

// Sleep - 42 levels from XML
const sleepMp = [17, 17, 18, 20, 21, 21, 23, 24, 24, 27, 27, 28, 30, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 44, 45, 46, 47, 48, 48, 49, 50, 51, 51, 52, 53, 53, 54, 55];
const sleepMpInit = [5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 14, 14, 14, 14];
const sleepMagicLvl = [23, 24, 25, 28, 29, 30, 33, 34, 35, 38, 39, 40, 42, 43, 44, 46, 47, 48, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74];

export const skill_1069: SkillDefinition = {
  id: 1069,
  code: "SP_1069",
  name: "Sleep",
  description: "Puts a single enemy to sleep for 30 seconds.\n\nУсыпляет врага на 30 секунд.",
  icon: "/skills/Skill1069_0.jpg",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 10,
  cooldown: 6,
  duration: 30,
  chance: 80,
  levels: sleepMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: sleepMagicLvl[index],
    spCost: index < 4 ? 2200 : index < 8 ? 3900 : index < 12 ? 7700 : index < 16 ? 15000 : index < 20 ? 30000 : index < 24 ? 50000 : index < 28 ? 80000 : index < 32 ? 120000 : index < 36 ? 160000 : 200000,
    mpCost: sleepMpInit[index] + mp,
    power: 0,
  })),
};

