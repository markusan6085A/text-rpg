import { SkillDefinition } from "../../../types";

export const skill_0258: SkillDefinition = {
  id: 258,
  code: "HM_0258",
  name: "Light Armor Mastery",
  description: "Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.\n\nУвеличивает физ. защиту, скорость каста, скорость атаки и регенерацию MP при ношении легкой брони.",
  icon: "/skills/skill0258.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // value з levelDef.power
    { stat: "castSpeed", mode: "multiplier", multiplier: 1.88 }, // mAtkSpd * 1.88
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.25 }, // pAtkSpd * 1.25
    { stat: "mpRegen", mode: "multiplier", multiplier: 1.2 }, // regMp * 1.2
  ],
  stackType: "light_armor_mastery",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 10000, mpCost: 0, power: 11.1 },
    { level: 2, requiredLevel: 40, spCost: 10000, mpCost: 0, power: 11.8 },
    { level: 3, requiredLevel: 40, spCost: 10000, mpCost: 0, power: 12.5 },
    { level: 4, requiredLevel: 44, spCost: 14000, mpCost: 0, power: 14.0 },
    { level: 5, requiredLevel: 44, spCost: 14000, mpCost: 0, power: 14.8 },
    { level: 6, requiredLevel: 44, spCost: 14000, mpCost: 0, power: 15.6 },
    { level: 7, requiredLevel: 48, spCost: 25000, mpCost: 0, power: 17.3 },
    { level: 8, requiredLevel: 48, spCost: 25000, mpCost: 0, power: 18.1 },
    { level: 9, requiredLevel: 48, spCost: 25000, mpCost: 0, power: 19.0 },
    { level: 10, requiredLevel: 52, spCost: 35000, mpCost: 0, power: 20.8 },
    { level: 11, requiredLevel: 52, spCost: 35000, mpCost: 0, power: 21.7 },
    { level: 12, requiredLevel: 52, spCost: 35000, mpCost: 0, power: 22.6 },
    { level: 13, requiredLevel: 56, spCost: 42000, mpCost: 0, power: 24.5 },
    { level: 14, requiredLevel: 56, spCost: 42000, mpCost: 0, power: 25.5 },
    { level: 15, requiredLevel: 56, spCost: 42000, mpCost: 0, power: 26.4 },
    { level: 16, requiredLevel: 58, spCost: 79000, mpCost: 0, power: 27.4 },
    { level: 17, requiredLevel: 58, spCost: 79000, mpCost: 0, power: 28.4 },
    { level: 18, requiredLevel: 60, spCost: 110000, mpCost: 0, power: 29.5 },
    { level: 19, requiredLevel: 60, spCost: 110000, mpCost: 0, power: 30.5 },
    { level: 20, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 31.6 },
    { level: 21, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 32.6 },
    { level: 22, requiredLevel: 64, spCost: 200000, mpCost: 0, power: 33.7 },
    { level: 23, requiredLevel: 64, spCost: 200000, mpCost: 0, power: 34.8 },
    { level: 24, requiredLevel: 66, spCost: 270000, mpCost: 0, power: 35.9 },
    { level: 25, requiredLevel: 66, spCost: 270000, mpCost: 0, power: 37.0 },
    { level: 26, requiredLevel: 68, spCost: 320000, mpCost: 0, power: 38.1 },
    { level: 27, requiredLevel: 68, spCost: 320000, mpCost: 0, power: 39.2 },
    { level: 28, requiredLevel: 70, spCost: 340000, mpCost: 0, power: 40.3 },
    { level: 29, requiredLevel: 70, spCost: 340000, mpCost: 0, power: 41.4 },
    { level: 30, requiredLevel: 72, spCost: 630000, mpCost: 0, power: 42.6 },
    { level: 31, requiredLevel: 72, spCost: 630000, mpCost: 0, power: 43.7 },
    { level: 32, requiredLevel: 74, spCost: 820000, mpCost: 0, power: 44.8 },
    { level: 33, requiredLevel: 74, spCost: 820000, mpCost: 0, power: 46.0 },
  ]
};
