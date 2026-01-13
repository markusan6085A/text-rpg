import { SkillDefinition } from "../../../types";

// Armor Mastery - increases defense
// XML: #pDef: 9 11 12 13 14
export const skill_0142: SkillDefinition = {
  id: 142,
  code: "DF_0142",
  name: "Armor Mastery",
  description: "Defense increase.\n\nУвеличивает физическую защиту.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "flat" }], // Value from level.power
  levels: [
    { level: 1, requiredLevel: 5, spCost: 310, mpCost: 0, power: 9 },
    { level: 2, requiredLevel: 10, spCost: 550, mpCost: 0, power: 11 },
    { level: 3, requiredLevel: 15, spCost: 6700, mpCost: 0, power: 12 },
    { level: 4, requiredLevel: 15, spCost: 3300, mpCost: 0, power: 13 },
    { level: 5, requiredLevel: 15, spCost: 3300, mpCost: 0, power: 14 },
  ],
};

