import { SkillDefinition } from "../../../types";

// Light Armor Mastery - passive skill (Levels 5-12 for OrcShaman)
export const skill_0236: SkillDefinition = {
  id: 236,
  code: "OS_0236",
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
    { level: 5, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 21.2 },
    { level: 6, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 23.2 },
    { level: 7, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 25.5 },
    { level: 8, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 27 },
    { level: 9, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 30.1 },
    { level: 10, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 32.5 },
    { level: 11, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 36.3 },
    { level: 12, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 39.1 },
  ],
};

