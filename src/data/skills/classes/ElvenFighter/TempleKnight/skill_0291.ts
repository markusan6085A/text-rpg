import { SkillDefinition } from "../../../types";

// Final Fortress - automatically increases P. Def when HP level falls
export const skill_0291: SkillDefinition = {
  id: 291,
  code: "TK_0291",
  name: "Final Fortress",
  description: "Automatically increases P. Def. when HP level falls.\n\nАвтоматически увеличивает физическую защиту на 116.875 когда уровень HP падает ниже 20% от максимума.",
  icon: "/skills/skill0291.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  hpThreshold: 0.2,
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 116.875 },
    { level: 2, requiredLevel: 55, spCost: 180000, mpCost: 0, power: 129 },
    { level: 3, requiredLevel: 58, spCost: 200000, mpCost: 0, power: 141.625 },
    { level: 4, requiredLevel: 60, spCost: 220000, mpCost: 0, power: 150.375 },
    { level: 5, requiredLevel: 62, spCost: 310000, mpCost: 0, power: 159.25 },
    { level: 6, requiredLevel: 64, spCost: 370000, mpCost: 0, power: 168.375 },
    { level: 7, requiredLevel: 66, spCost: 580000, mpCost: 0, power: 177.625 },
    { level: 8, requiredLevel: 68, spCost: 650000, mpCost: 0, power: 187 },
    { level: 9, requiredLevel: 70, spCost: 720000, mpCost: 0, power: 196.5 },
    { level: 10, requiredLevel: 72, spCost: 1200000, mpCost: 0, power: 206.125 },
    { level: 11, requiredLevel: 74, spCost: 1900000, mpCost: 0, power: 215.75 },
  ],
};

