import { SkillDefinition } from "../../../types";

// Weapon Mastery - passive skill that increases P. Atk. and M. Atk. (Levels 3-9 for OrcShaman)
export const skill_0141: SkillDefinition = {
  id: 141,
  code: "OS_0141",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физическую и магическую атаку.",
  icon: "/skills/Skill0141_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
    { stat: "mAtk", mode: "flat" },
    { stat: "pAtk", mode: "percent", value: 45 },
    { stat: "mAtk", mode: "percent", value: 17 },
  ],
  levels: [
    { level: 3, requiredLevel: 20, spCost: 2900, mpCost: 0, power: 4.5 },
    { level: 4, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 5.7 },
    { level: 5, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 6.7 },
    { level: 6, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 8.3 },
    { level: 7, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 9.5 },
    { level: 8, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 11.6 },
    { level: 9, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 13.3 },
  ],
};

