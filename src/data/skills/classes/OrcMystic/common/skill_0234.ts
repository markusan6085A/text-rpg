import { SkillDefinition } from "../../../types";

// Robe Mastery - passive skill that increases P. Def. when wearing a robe
export const skill_0234: SkillDefinition = {
  id: 234,
  code: "OM_0234",
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
    { level: 1, requiredLevel: 7, spCost: 260, mpCost: 0, power: 11.6 },
    { level: 2, requiredLevel: 7, spCost: 260, mpCost: 0, power: 13.4 },
    { level: 3, requiredLevel: 14, spCost: 880, mpCost: 0, power: 16.1 },
    { level: 4, requiredLevel: 14, spCost: 880, mpCost: 0, power: 18.4 },
  ],
};

