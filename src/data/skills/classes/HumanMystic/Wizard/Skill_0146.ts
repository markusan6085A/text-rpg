import { SkillDefinition } from "../../../types";

// Anti Magic
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "HM_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту.",
  icon: "/skills/skill0146.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mDef", mode: "flat" }],
  levels: [
    { level: 5, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 20 },
    { level: 6, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 23 },
    { level: 7, requiredLevel: 25, spCost: 2800, mpCost: 0, power: 25 },
    { level: 8, requiredLevel: 25, spCost: 2800, mpCost: 0, power: 28 },
    { level: 9, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 30 },
    { level: 10, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 34 },
    { level: 11, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 36 },
    { level: 12, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 40 },
  ],
};
