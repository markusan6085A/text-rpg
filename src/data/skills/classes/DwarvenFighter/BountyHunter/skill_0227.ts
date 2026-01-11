import { SkillDefinition } from "../../../types";

// Light Armor Mastery - levels 14-50
// XML: #pDef: 21.5 22.7 24 25.3 26.6 27.9 29.3 30.7 32.1 33.6 35 36.5 38.1 39.6 41.2 42.8 44.5 46.1 47.8 49.5 51.3 53 54.8 56.6 58.4 60.2 62.1 64 65.8 67.7 69.7 71.6 73.5 75.5 77.4 79.4 81.3
// #rEvas: 6 for all levels
export const skill_0227: SkillDefinition = {
  id: 227,
  code: "BH_0227",
  name: "Light Armor Mastery",
  description: "Increases P. Def. and Evasion when wearing light armor.\n\nУвеличивает физическую защиту и уклонение при ношении легкой брони.",
  icon: "/skills/skill0227.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
    { stat: "evasion", mode: "flat", value: 6 }, // +6 evasion always
  ],
  levels: [
    { level: 14, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 21.5 },
    { level: 15, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 22.7 },
    { level: 16, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 24 },
    { level: 17, requiredLevel: 43, spCost: 15000, mpCost: 0, power: 25.3 },
    { level: 18, requiredLevel: 43, spCost: 15000, mpCost: 0, power: 26.6 },
    { level: 19, requiredLevel: 43, spCost: 15000, mpCost: 0, power: 27.9 },
    { level: 20, requiredLevel: 46, spCost: 22000, mpCost: 0, power: 29.3 },
    { level: 21, requiredLevel: 46, spCost: 22000, mpCost: 0, power: 30.7 },
    { level: 22, requiredLevel: 46, spCost: 22000, mpCost: 0, power: 32.1 },
    { level: 23, requiredLevel: 49, spCost: 36000, mpCost: 0, power: 33.6 },
    { level: 24, requiredLevel: 49, spCost: 36000, mpCost: 0, power: 35 },
    { level: 25, requiredLevel: 49, spCost: 36000, mpCost: 0, power: 36.5 },
    { level: 26, requiredLevel: 52, spCost: 63000, mpCost: 0, power: 38.1 },
    { level: 27, requiredLevel: 52, spCost: 63000, mpCost: 0, power: 39.6 },
    { level: 28, requiredLevel: 52, spCost: 63000, mpCost: 0, power: 41.2 },
    { level: 29, requiredLevel: 55, spCost: 81000, mpCost: 0, power: 42.8 },
    { level: 30, requiredLevel: 55, spCost: 81000, mpCost: 0, power: 44.5 },
    { level: 31, requiredLevel: 55, spCost: 81000, mpCost: 0, power: 46.1 },
    { level: 32, requiredLevel: 58, spCost: 100000, mpCost: 0, power: 47.8 },
    { level: 33, requiredLevel: 58, spCost: 100000, mpCost: 0, power: 49.5 },
    { level: 34, requiredLevel: 58, spCost: 100000, mpCost: 0, power: 51.3 },
    { level: 35, requiredLevel: 60, spCost: 210000, mpCost: 0, power: 53 },
    { level: 36, requiredLevel: 60, spCost: 210000, mpCost: 0, power: 54.8 },
    { level: 37, requiredLevel: 62, spCost: 220000, mpCost: 0, power: 56.6 },
    { level: 38, requiredLevel: 62, spCost: 220000, mpCost: 0, power: 58.4 },
    { level: 39, requiredLevel: 64, spCost: 300000, mpCost: 0, power: 60.2 },
    { level: 40, requiredLevel: 64, spCost: 300000, mpCost: 0, power: 62.1 },
    { level: 41, requiredLevel: 66, spCost: 390000, mpCost: 0, power: 64 },
    { level: 42, requiredLevel: 66, spCost: 390000, mpCost: 0, power: 65.8 },
    { level: 43, requiredLevel: 68, spCost: 430000, mpCost: 0, power: 67.7 },
    { level: 44, requiredLevel: 68, spCost: 430000, mpCost: 0, power: 69.7 },
    { level: 45, requiredLevel: 70, spCost: 520000, mpCost: 0, power: 71.6 },
    { level: 46, requiredLevel: 70, spCost: 520000, mpCost: 0, power: 73.5 },
    { level: 47, requiredLevel: 72, spCost: 840000, mpCost: 0, power: 75.5 },
    { level: 48, requiredLevel: 72, spCost: 840000, mpCost: 0, power: 77.4 },
    { level: 49, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 79.4 },
    { level: 50, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 81.3 },
  ],
};

