import { SkillDefinition } from "../../../types";

// Anti Magic - increases Magic Defense
// З XML: levels="45", mDef: 10-108
// Для Elven Oracle: рівні 5-12 (requiredLevel: 20-35)
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "EO_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту на 18-40 (зависит от уровня).",
  icon: "/skills/Skill0146_0.jpg",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 5, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 18 },
    { level: 6, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 20 },
    { level: 7, requiredLevel: 25, spCost: 3200, mpCost: 0, power: 23 },
    { level: 8, requiredLevel: 25, spCost: 3200, mpCost: 0, power: 25 },
    { level: 9, requiredLevel: 30, spCost: 6200, mpCost: 0, power: 28 },
    { level: 10, requiredLevel: 30, spCost: 6200, mpCost: 0, power: 30 },
    { level: 11, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 34 },
    { level: 12, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 36 },
  ],
};

