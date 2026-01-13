import { SkillDefinition } from "../../../types";

// Armor Mastery - 3 levels from XML
// pDef values: 6.7, 8.0, 9.2
export const skill_0244: SkillDefinition = {
  id: 244,
  code: "DM_0244",
  name: "Armor Mastery",
  description: "Increases Physical Defense.\n\nУвеличивает физическую защиту.",
  icon: "/skills/Skill0244_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "flat" }], // Flat addition from XML
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 0, power: 6.7 },
    { level: 2, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 8.0 },
    { level: 3, requiredLevel: 20, spCost: 3000, mpCost: 0, power: 9.2 },
  ],
};



