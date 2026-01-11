import { SkillDefinition } from "../../../types";

// Robe Mastery - passive skill (Levels 5-12 for OrcShaman)
export const skill_0234: SkillDefinition = {
  id: 234,
  code: "OS_0234",
  name: "Robe Mastery",
  description: "Increases P. Def. when wearing a robe.\n\nУвеличивает физическую защиту при ношении мантии.",
  icon: "/skills/Skill0234_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
  ],
  levels: [
    { level: 5, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 20.9 },
    { level: 6, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 23.8 },
    { level: 7, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 26.9 },
    { level: 8, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 29.1 },
    { level: 9, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 32.8 },
    { level: 10, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 35.4 },
    { level: 11, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 39.6 },
    { level: 12, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 42.6 },
  ],
};

