import { SkillDefinition } from "../../../types";

// Light Armor Mastery - passive skill that increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor
export const skill_0236: SkillDefinition = {
  id: 236,
  code: "OM_0236",
  name: "Light Armor Mastery",
  description: "Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.\n\nУвеличивает физическую защиту, скорость каста, скорость атаки и регенерацию MP при ношении легкой брони.",
  icon: "/skills/Skill0236_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
    { stat: "castSpeed", mode: "percent", value: 90 },
    { stat: "atkSpeed", mode: "percent", value: 25 },
    { stat: "mpRegen", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 260, mpCost: 0, power: 12.6 },
    { level: 2, requiredLevel: 7, spCost: 260, mpCost: 0, power: 14.5 },
    { level: 3, requiredLevel: 14, spCost: 880, mpCost: 0, power: 17.5 },
    { level: 4, requiredLevel: 14, spCost: 880, mpCost: 0, power: 19.3 },
  ],
};

