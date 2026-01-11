import { SkillDefinition } from "../../../types";

// Robe Mastery - increases P. Def. when wearing a robe (continuation for Elven Elder)
// З XML: skill 235, levels="41", pDef: 7.2-87.4
// Для Elven Elder: рівні 9-41 (requiredLevel: 40-74)
const pDefValues = [26.3, 27.6, 28.8, 31.5, 32.9, 34.2, 37.1, 38.6, 40.1, 43.2, 44.8, 46.4, 49.8, 51.5, 53.2, 54.9, 56.7, 58.5, 60.3, 62.1, 64, 65.9, 67.7, 69.7, 71.6, 73.5, 75.5, 77.4, 79.4, 81.4, 83.4, 85.4, 87.4];

export const skill_0234: SkillDefinition = {
  id: 234,
  code: "EE_0234",
  name: "Robe Mastery",
  description: "Increases P. Def. when wearing a robe.\n\nУвеличивает физическую защиту при ношении мантии на 26.3-87.4 (зависит от уровня).",
  icon: "/skills/skill0234.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
  ],
  levels: pDefValues.map((pDef, index) => ({
    level: index + 9, // Starting from level 9
    requiredLevel: [40, 40, 40, 44, 44, 44, 48, 48, 48, 52, 52, 52, 56, 56, 56, 58, 58, 60, 60, 62, 62, 64, 64, 66, 66, 68, 68, 70, 70, 72, 72, 74, 74][index],
    spCost: [11000, 11000, 11000, 14000, 14000, 14000, 22000, 22000, 22000, 30000, 30000, 30000, 31000, 31000, 31000, 52000, 52000, 79000, 79000, 110000, 110000, 130000, 130000, 170000, 170000, 210000, 210000, 260000, 260000, 390000, 390000, 550000, 550000][index],
    mpCost: 0,
    power: pDef,
  })),
};













