import { SkillDefinition } from "../../../types";

// Shadow Flare - 14 levels from XML
const mpConsumeInitValues = [9, 10, 11, 12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 17];
const mpConsumeValues = [35, 39, 43, 47, 51, 53, 55, 58, 59, 61, 63, 65, 67, 68];
const magicLvlValues = [40, 44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];
const powerValues = [65.0, 73.0, 81.0, 89.0, 98.0, 102.0, 107.0, 111.0, 115.0, 119.0, 123.0, 127.0, 131.0, 135.0];

export const skill_1267: SkillDefinition = {
  id: 1267,
  code: "SP_1267",
  name: "Shadow Flare",
  description: "Attacks a target with dark magic. Power 65. Over-hit is possible.\n\nАтакует цель темной магией. Сила 65. Возможен оверхит.",
  icon: "/skills/skill1267.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 5,
  cooldown: 30,
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 17000 : index < 4 ? 22000 : index < 6 ? 33000 : index < 8 ? 53000 : index < 10 ? 56000 : index < 12 ? 73000 : index < 14 ? 88000 : 130000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power: power,
  })),
};

