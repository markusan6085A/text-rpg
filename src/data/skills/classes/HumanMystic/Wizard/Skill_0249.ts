import { SkillDefinition } from "../../../types";

// Weapon Mastery
export const skill_0249: SkillDefinition = {
  id: 249,
  code: "HM_0249",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физ. атаку и маг. атаку.",
  icon: "/skills/skill0249.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent" },
    { stat: "mAtk", mode: "percent" },
  ],
  levels: [
    { level: 3, requiredLevel: 20, spCost: 2900, mpCost: 0, power: 4.5 },
    { level: 4, requiredLevel: 25, spCost: 2800, mpCost: 0, power: 5.7 },
    { level: 5, requiredLevel: 25, spCost: 2800, mpCost: 0, power: 6.7 },
    { level: 6, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 8.3 },
    { level: 7, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 9.5 },
    { level: 8, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 11.6 },
    { level: 9, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 13.3 },
  ],
};
