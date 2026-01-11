import { SkillDefinition } from "../../../types";

export const skill_0236: SkillDefinition = {
  id: 236,
  code: "HM_0236",
  name: "Light Armor Mastery",
  description: "Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.\n\nУвеличивает физ. защиту, скорость каста, скорость атаки и регенерацию MP при ношении легкой брони.",
  icon: "/skills/skill0236.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
    { stat: "castSpeed", mode: "percent", value: 1 }, // effect text mentions cast speed; numeric bonus not listed, keep minimal placeholder
    { stat: "atkSpeed", mode: "percent", value: 1 }, // same reasoning as above
    { stat: "mpRegen", mode: "flat", value: 0.5 }, // small regen bonus placeholder to reflect effect presence
  ],
  stackType: "light_armor_mastery",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 5.4 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 6.3 },
    { level: 3, requiredLevel: 25, spCost: 3400, mpCost: 0, power: 7.8 },
    { level: 4, requiredLevel: 25, spCost: 3400, mpCost: 0, power: 8.8 },
    { level: 5, requiredLevel: 30, spCost: 6600, mpCost: 0, power: 10.9 },
    { level: 6, requiredLevel: 30, spCost: 6600, mpCost: 0, power: 12.5 },
    { level: 7, requiredLevel: 35, spCost: 11000, mpCost: 0, power: 15 },
    { level: 8, requiredLevel: 35, spCost: 11000, mpCost: 0, power: 16.9 },
  ],
};

