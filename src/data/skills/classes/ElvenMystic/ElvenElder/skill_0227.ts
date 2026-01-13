import { SkillDefinition } from "../../../types";

// Light Armor Mastery - increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor (continuation for Elven Elder)
// З XML: skill 236, levels="41", pDef: 5.4-69.6
// Для Elven Elder: рівні 9-41 (requiredLevel: 40-74)
const pDefValues = [19.8, 20.8, 21.8, 24, 25.1, 26.3, 28.6, 29.8, 31, 33.6, 34.9, 36.2, 38.9, 40.3, 41.7, 43.1, 44.6, 46, 47.5, 49, 50.5, 52.1, 53.6, 55.2, 56.7, 58.3, 59.9, 61.5, 63.1, 64.7, 66.4, 68, 69.6];

export const skill_0227: SkillDefinition = {
  id: 227,
  code: "EE_0227",
  name: "Light Armor Mastery",
  description: "Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.\n\nУвеличивает физическую защиту в легкой броне на 19.8-69.6 (зависит от уровня).\nУвеличивает скорость каста в легкой броне на 91%.\nУвеличивает скорость атаки в легкой броне на 25%.\nУвеличивает регенерацию MP в легкой броне на 20%.",
  icon: "/skills/skill0227.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
    { stat: "castSpeed", mode: "percent", value: 91 },
    { stat: "attackSpeed", mode: "percent", value: 25 },
    { stat: "mpRegen", mode: "percent", value: 20 },
  ],
  levels: pDefValues.map((pDef, index) => ({
    level: index + 9, // Starting from level 9
    requiredLevel: [40, 40, 40, 44, 44, 44, 48, 48, 48, 52, 52, 52, 56, 56, 56, 58, 58, 60, 60, 62, 62, 64, 64, 66, 66, 68, 68, 70, 70, 72, 72, 74, 74][index],
    spCost: [11000, 11000, 11000, 14000, 14000, 14000, 22000, 22000, 22000, 30000, 30000, 30000, 31000, 31000, 31000, 52000, 52000, 79000, 79000, 110000, 110000, 130000, 130000, 170000, 170000, 210000, 210000, 260000, 260000, 390000, 390000, 550000, 550000][index],
    mpCost: 0,
    power: pDef,
  })),
};













