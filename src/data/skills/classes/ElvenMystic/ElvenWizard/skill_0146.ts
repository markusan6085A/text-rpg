import { SkillDefinition } from "../../../types";

// Anti Magic - increases M. Def.
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "EW_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту на 18-36 (зависит от уровня).",
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
    { level: 5, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 18 },
    { level: 6, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 20 },
    { level: 7, requiredLevel: 25, spCost: 3100, mpCost: 0, power: 23 },
    { level: 8, requiredLevel: 25, spCost: 3100, mpCost: 0, power: 25 },
    { level: 9, requiredLevel: 30, spCost: 5800, mpCost: 0, power: 28 },
    { level: 10, requiredLevel: 30, spCost: 5800, mpCost: 0, power: 30 },
    { level: 11, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 34 },
    { level: 12, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 36 },
  ],
};

