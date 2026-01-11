import { SkillDefinition } from "../../../types";

// Anti Magic - increases Magic Defense
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "EM_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту на 10-16 (зависит от уровня).",
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
    { level: 1, requiredLevel: 7, spCost: 260, mpCost: 0, power: 10 },
    { level: 2, requiredLevel: 7, spCost: 260, mpCost: 0, power: 12 },
    { level: 3, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 14 },
    { level: 4, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 16 },
  ],
};

