import { SkillDefinition } from "../../../types";

// Vampiric Claw - 28 levels from XML
const powerValues = [49.0, 52.0, 55.0, 58.0, 61.0, 65.0, 68.0, 72.0, 75.0, 78.0, 80.0, 82.0, 84.0, 85.0, 87.0, 89.0, 90.0, 92.0, 94.0, 96.0, 97.0, 99.0, 100.0, 102.0, 104.0, 105.0, 107.0, 108.0];
const mpConsumeInitValues = [12, 13, 13, 14, 16, 16, 17, 17, 18, 19, 19, 19, 20, 20, 20, 22, 21, 22, 22, 22, 23, 23, 24, 24, 24, 24, 25, 25];
const mpConsumeValues = [48, 50, 54, 56, 58, 62, 65, 68, 71, 74, 75, 78, 78, 80, 82, 82, 84, 85, 87, 88, 89, 91, 91, 93, 95, 96, 97, 98];
const magicLvlValues = [38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74];

export const skill_1234: SkillDefinition = {
  id: 1234,
  code: "SP_1234",
  name: "Vampiric Claw",
  description: "Dark magic attack that absorbs HP. Power 49. Absorbs 20% of damage dealt.\n\nТемная магическая атака, поглощающая HP. Сила 49. Поглощает 20% нанесенного урона.",
  icon: "/skills/skill1234.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  effects: [{ stat: "vampirism", mode: "percent", value: 20 }],
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 17000 : index < 4 ? 22000 : index < 6 ? 33000 : index < 8 ? 53000 : index < 10 ? 56000 : index < 12 ? 73000 : index < 14 ? 88000 : index < 16 ? 130000 : index < 18 ? 150000 : index < 20 ? 210000 : index < 24 ? 290000 : index < 26 ? 470000 : 640000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power: power,
  })),
};

