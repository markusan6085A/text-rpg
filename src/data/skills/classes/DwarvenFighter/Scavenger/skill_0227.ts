import { SkillDefinition } from "../../../types";

// Light Armor Mastery - 13 levels
// XML: #pDef: 4.2 5.3 6.5 7.7 9 9.9 10.8 12.7 13.7 14.8 16.9 18 19.1
// #rEvas: 3 3 5 5 6 6 6 6 6 6 6 6 6
export const skill_0227: SkillDefinition = {
  id: 227,
  code: "SC_0227",
  name: "Light Armor Mastery",
  description: "Increases P. Def. and Evasion when wearing light armor.\n\nУвеличивает физическую защиту и уклонение при ношении легкой брони.",
  icon: "/skills/skill0227.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
    { stat: "evasion", mode: "flat" }, // Value calculated from level index
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2100, mpCost: 0, power: 4.2 }, // evasion: 3
    { level: 2, requiredLevel: 20, spCost: 2100, mpCost: 0, power: 5.3 }, // evasion: 3
    { level: 3, requiredLevel: 24, spCost: 3900, mpCost: 0, power: 6.5 }, // evasion: 5
    { level: 4, requiredLevel: 24, spCost: 3900, mpCost: 0, power: 7.7 }, // evasion: 5
    { level: 5, requiredLevel: 28, spCost: 4400, mpCost: 0, power: 9 }, // evasion: 6
    { level: 6, requiredLevel: 28, spCost: 4400, mpCost: 0, power: 9.9 }, // evasion: 6
    { level: 7, requiredLevel: 28, spCost: 4400, mpCost: 0, power: 10.8 }, // evasion: 6
    { level: 8, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 12.7 }, // evasion: 6
    { level: 9, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 13.7 }, // evasion: 6
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 14.8 }, // evasion: 6
    { level: 11, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 16.9 }, // evasion: 6
    { level: 12, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 18 }, // evasion: 6
    { level: 13, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 19.1 }, // evasion: 6
  ],
};

