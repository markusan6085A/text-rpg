import { SkillDefinition } from "../../../types";

// Final Fortress - automatically increases P. Def when HP level falls
export const skill_0291: SkillDefinition = {
  id: 291,
  code: "SK_0291",
  name: "Final Fortress",
  description: "Automatically increases P. Def. when HP level falls.\n\nАвтоматически увеличивает физическую защиту, когда уровень HP падает.",
  icon: "/skills/skill0291.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  hpThreshold: 20, // Activates when HP falls below 20%
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 94000, mpCost: 0, power: 116.875 },
    { level: 2, requiredLevel: 55, spCost: 130000, mpCost: 0, power: 129 },
    { level: 3, requiredLevel: 58, spCost: 140000, mpCost: 0, power: 141.125 },
    { level: 4, requiredLevel: 60, spCost: 180000, mpCost: 0, power: 150.375 },
    { level: 5, requiredLevel: 62, spCost: 240000, mpCost: 0, power: 159.625 },
    { level: 6, requiredLevel: 64, spCost: 280000, mpCost: 0, power: 168.375 },
    { level: 7, requiredLevel: 66, spCost: 410000, mpCost: 0, power: 177.125 },
    { level: 8, requiredLevel: 68, spCost: 480000, mpCost: 0, power: 185.875 },
    { level: 9, requiredLevel: 70, spCost: 510000, mpCost: 0, power: 194.625 },
    { level: 10, requiredLevel: 72, spCost: 880000, mpCost: 0, power: 206.125 },
    { level: 11, requiredLevel: 74, spCost: 1400000, mpCost: 0, power: 215.75 },
  ],
};

