import { SkillDefinition } from "../../../types";

// Hurricane - 28 levels from XML
const powerValues = [49.0, 52.0, 55.0, 58.0, 61.0, 65.0, 68.0, 72.0, 75.0, 78.0, 80.0, 82.0, 84.0, 85.0, 87.0, 89.0, 90.0, 92.0, 94.0, 96.0, 97.0, 99.0, 100.0, 102.0, 104.0, 105.0, 107.0, 108.0];
const mpConsumeInitValues = [7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 14, 14, 14, 14];
const mpConsumeValues = [27, 28, 30, 31, 33, 35, 36, 38, 39, 41, 42, 43, 44, 44, 45, 46, 47, 48, 48, 49, 50, 51, 51, 52, 53, 53, 54, 55];
const magicLvlValues = [38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74];

export const skill_1239: SkillDefinition = {
  id: 1239,
  code: "SP_1239",
  name: "Hurricane",
  description: "Attacks a target with violent winds. Power 49.\n\nАтакует цель сильными ветрами. Сила 49.",
  icon: "/skills/skill1239.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "wind",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 17000 : index < 4 ? 22000 : index < 6 ? 33000 : index < 8 ? 53000 : index < 10 ? 56000 : index < 12 ? 73000 : index < 14 ? 88000 : index < 16 ? 130000 : index < 18 ? 150000 : index < 20 ? 210000 : index < 24 ? 290000 : index < 26 ? 470000 : 640000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power: power,
  })),
};

