import { SkillDefinition } from "../../../types";

// Armor Mastery - increases defense
export const skill_0141: SkillDefinition = {
  id: 141,
  code: "EM_0141",
  name: "Armor Mastery",
  description: "Defense increase.\n\nУвеличивает физическую защиту на 6.7-9.2 (зависит от уровня).",
  icon: "/skills/skill0141.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 0, power: 6.7 },
    { level: 2, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 8 },
    { level: 3, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 9.2 },
  ],
};

