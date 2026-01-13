import { SkillDefinition } from "../../../types";

// Anti Magic - increases M. Def. (continues from Elven Wizard level 12)
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "ES_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту на 40-95 (зависит от уровня).",
  icon: "/skills/skill0146.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 13, requiredLevel: 40, spCost: 9000, mpCost: 0, power: 40 },
    { level: 14, requiredLevel: 40, spCost: 9000, mpCost: 0, power: 42 },
    { level: 15, requiredLevel: 40, spCost: 9000, mpCost: 0, power: 43 },
    { level: 16, requiredLevel: 44, spCost: 12000, mpCost: 0, power: 46 },
    { level: 17, requiredLevel: 44, spCost: 12000, mpCost: 0, power: 47 },
    { level: 18, requiredLevel: 44, spCost: 12000, mpCost: 0, power: 49 },
    { level: 19, requiredLevel: 48, spCost: 20000, mpCost: 0, power: 52 },
    { level: 20, requiredLevel: 48, spCost: 20000, mpCost: 0, power: 54 },
    { level: 21, requiredLevel: 48, spCost: 20000, mpCost: 0, power: 56 },
    { level: 22, requiredLevel: 52, spCost: 32000, mpCost: 0, power: 59 },
    { level: 23, requiredLevel: 52, spCost: 32000, mpCost: 0, power: 61 },
    { level: 24, requiredLevel: 52, spCost: 32000, mpCost: 0, power: 63 },
    { level: 25, requiredLevel: 56, spCost: 32000, mpCost: 0, power: 66 },
    { level: 26, requiredLevel: 56, spCost: 32000, mpCost: 0, power: 68 },
    { level: 27, requiredLevel: 56, spCost: 32000, mpCost: 0, power: 70 },
    { level: 28, requiredLevel: 58, spCost: 61000, mpCost: 0, power: 72 },
    { level: 29, requiredLevel: 58, spCost: 61000, mpCost: 0, power: 74 },
    { level: 30, requiredLevel: 60, spCost: 75000, mpCost: 0, power: 76 },
    { level: 31, requiredLevel: 60, spCost: 75000, mpCost: 0, power: 78 },
    { level: 32, requiredLevel: 62, spCost: 120000, mpCost: 0, power: 80 },
    { level: 33, requiredLevel: 62, spCost: 120000, mpCost: 0, power: 82 },
    { level: 34, requiredLevel: 64, spCost: 150000, mpCost: 0, power: 85 },
    { level: 35, requiredLevel: 64, spCost: 150000, mpCost: 0, power: 87 },
    { level: 36, requiredLevel: 66, spCost: 190000, mpCost: 0, power: 90 },
    { level: 37, requiredLevel: 66, spCost: 190000, mpCost: 0, power: 93 },
    { level: 38, requiredLevel: 68, spCost: 190000, mpCost: 0, power: 93 },
    { level: 39, requiredLevel: 68, spCost: 190000, mpCost: 0, power: 95 },
  ],
};

