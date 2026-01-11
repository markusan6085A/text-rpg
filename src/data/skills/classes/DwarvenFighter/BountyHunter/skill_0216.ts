import { SkillDefinition } from "../../../types";

// Polearm Mastery - levels 9-45
// XML: #pAtk: 23.7 25.4 27.1 29 30.9 32.9 35 37.1 39.4 41.7 44.1 46.6 49.2 51.9 54.6 57.5 60.4 63.3 66.4 69.5 72.7 76 79.3 82.7 86.1 89.6 93.1 96.6 100.2 103.8 107.5 111.1 114.8 118.4 122.1 125.7 129.3
// Accuracy: +10 for all levels
export const skill_0216: SkillDefinition = {
  id: 216,
  code: "BH_0216",
  name: "Polearm Mastery",
  description: "Increases P. Atk. when using a Polearm.\n\nУвеличивает физическую атаку при использовании древкового оружия.",
  icon: "/skills/skill0216.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" }, // Value from level.power
    { stat: "accuracy", mode: "flat", value: 10 }, // +10 accuracy always
  ],
  levels: [
    { level: 9, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 23.7 },
    { level: 10, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 25.4 },
    { level: 11, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 27.1 },
    { level: 12, requiredLevel: 43, spCost: 15000, mpCost: 0, power: 29 },
    { level: 13, requiredLevel: 43, spCost: 15000, mpCost: 0, power: 30.9 },
    { level: 14, requiredLevel: 43, spCost: 15000, mpCost: 0, power: 32.9 },
    { level: 15, requiredLevel: 46, spCost: 22000, mpCost: 0, power: 35 },
    { level: 16, requiredLevel: 46, spCost: 22000, mpCost: 0, power: 37.1 },
    { level: 17, requiredLevel: 46, spCost: 22000, mpCost: 0, power: 39.4 },
    { level: 18, requiredLevel: 49, spCost: 36000, mpCost: 0, power: 41.7 },
    { level: 19, requiredLevel: 49, spCost: 36000, mpCost: 0, power: 44.1 },
    { level: 20, requiredLevel: 49, spCost: 36000, mpCost: 0, power: 46.6 },
    { level: 21, requiredLevel: 52, spCost: 63000, mpCost: 0, power: 49.2 },
    { level: 22, requiredLevel: 52, spCost: 63000, mpCost: 0, power: 51.9 },
    { level: 23, requiredLevel: 52, spCost: 63000, mpCost: 0, power: 54.6 },
    { level: 24, requiredLevel: 55, spCost: 81000, mpCost: 0, power: 57.5 },
    { level: 25, requiredLevel: 55, spCost: 81000, mpCost: 0, power: 60.4 },
    { level: 26, requiredLevel: 55, spCost: 81000, mpCost: 0, power: 63.3 },
    { level: 27, requiredLevel: 58, spCost: 100000, mpCost: 0, power: 66.4 },
    { level: 28, requiredLevel: 58, spCost: 100000, mpCost: 0, power: 69.5 },
    { level: 29, requiredLevel: 58, spCost: 100000, mpCost: 0, power: 72.7 },
    { level: 30, requiredLevel: 60, spCost: 210000, mpCost: 0, power: 76 },
    { level: 31, requiredLevel: 60, spCost: 210000, mpCost: 0, power: 79.3 },
    { level: 32, requiredLevel: 62, spCost: 220000, mpCost: 0, power: 82.7 },
    { level: 33, requiredLevel: 62, spCost: 220000, mpCost: 0, power: 86.1 },
    { level: 34, requiredLevel: 64, spCost: 300000, mpCost: 0, power: 89.6 },
    { level: 35, requiredLevel: 64, spCost: 300000, mpCost: 0, power: 93.1 },
    { level: 36, requiredLevel: 66, spCost: 390000, mpCost: 0, power: 96.6 },
    { level: 37, requiredLevel: 66, spCost: 390000, mpCost: 0, power: 100.2 },
    { level: 38, requiredLevel: 68, spCost: 430000, mpCost: 0, power: 103.8 },
    { level: 39, requiredLevel: 68, spCost: 430000, mpCost: 0, power: 107.5 },
    { level: 40, requiredLevel: 70, spCost: 520000, mpCost: 0, power: 111.1 },
    { level: 41, requiredLevel: 70, spCost: 520000, mpCost: 0, power: 114.8 },
    { level: 42, requiredLevel: 72, spCost: 840000, mpCost: 0, power: 118.4 },
    { level: 43, requiredLevel: 72, spCost: 840000, mpCost: 0, power: 122.1 },
    { level: 44, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 125.7 },
    { level: 45, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 129.3 },
  ],
};

