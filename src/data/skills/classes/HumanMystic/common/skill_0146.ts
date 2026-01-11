import { SkillDefinition } from "../../../types";

export const skill_0146: SkillDefinition = {
  id: 146,
  code: "HM_0146",
  name: "Anti Magic",
  description: "Increases Magic Defense.\n\nУвеличивает магическую защиту.",
  icon: "/skills/Skill0146_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mDef", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 240, mpCost: 0, power: 5 },
    { level: 2, requiredLevel: 7, spCost: 240, mpCost: 0, power: 8 },
    { level: 3, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 11 },
    { level: 4, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 14 },
  ],
};


