import { SkillDefinition } from "../../../types";

// Weapon Mastery - increases P. Atk. and M. Atk. (continuation for Elven Elder)
// З XML: skill 249, levels="42", pAtk: 4.5-79.4, mAtk: 5.7-99.3
// Для Elven Elder: рівні 10-42 (requiredLevel: 40-74)
const pAtkValues = [16, 17, 18.1, 20.4, 21.6, 22.8, 25.5, 26.9, 28.3, 31.4, 33, 34.6, 38, 39.8, 41.7, 43.5, 45.4, 47.4, 49.4, 51.4, 53.5, 55.6, 57.7, 59.9, 62.0, 64.1, 66.8, 68.5, 70.7, 72.9, 75.1, 77.2, 79.4];
const mAtkValues = [20, 21.3, 22.6, 25.4, 26.9, 28.5, 31.8, 33.6, 35.4, 39.2, 41.2, 43.2, 47.5, 49.8, 52.1, 54.4, 56.8, 59.2, 61.7, 64.3, 66.8, 69.4, 72.1, 74.8, 77.4, 80.2, 82.9, 85.6, 88.4, 91.1, 93.8, 96.5, 99.3];

export const skill_0142: SkillDefinition = {
  id: 142,
  code: "EE_0142",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физическую атаку на 16-79.4 (зависит от уровня).\nУвеличивает магическую атаку на 20-99.3 (зависит от уровня).\nУвеличивает физическую атаку на 45%.\nУвеличивает магическую атаку на 17%.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
    { stat: "mAtk", mode: "flat" },
    { stat: "pAtk", mode: "percent", value: 45 },
    { stat: "mAtk", mode: "percent", value: 17 },
  ],
  levels: pAtkValues.map((pAtk, index) => ({
    level: index + 10, // Starting from level 10
    requiredLevel: [40, 40, 40, 44, 44, 44, 48, 48, 48, 52, 52, 52, 56, 56, 56, 58, 58, 60, 60, 62, 62, 64, 64, 66, 66, 68, 68, 70, 70, 72, 72, 74, 74][index],
    spCost: [11000, 11000, 11000, 14000, 14000, 14000, 22000, 22000, 22000, 30000, 30000, 30000, 31000, 31000, 31000, 52000, 52000, 79000, 79000, 110000, 110000, 130000, 130000, 170000, 170000, 210000, 210000, 260000, 260000, 390000, 390000, 550000, 550000][index],
    mpCost: 0,
    power: pAtk,
  })),
};













