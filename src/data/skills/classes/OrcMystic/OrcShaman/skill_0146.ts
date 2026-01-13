import { SkillDefinition } from "../../../types";

// Anti Magic - passive skill that increases M. Def. (Levels 5-12 for OrcShaman)
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "OS_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту.",
  icon: "/skills/Skill0146_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mDef", mode: "flat" },
  ],
  levels: [
    { level: 5, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 18 },
    { level: 6, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 20 },
    { level: 7, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 23 },
    { level: 8, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 25 },
    { level: 9, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 28 },
    { level: 10, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 30 },
    { level: 11, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 34 },
    { level: 12, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 36 },
  ],
};

