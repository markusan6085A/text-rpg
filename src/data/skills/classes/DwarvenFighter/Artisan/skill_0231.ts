import { SkillDefinition } from "../../../types";

// Heavy Armor Mastery - increases P. Def when wearing heavy armor
// XML: #pDef: 1.9 3.3 4.8 6.4 8.1 8.9 9.8 11.7 12.7 13.7 15.8 16.9 18
export const skill_0231: SkillDefinition = {
  id: 231,
  code: "AR_0231",
  name: "Heavy Armor Mastery",
  description: "Increases P. Def. when wearing heavy armor.\n\nУвеличивает физическую защиту при ношении тяжелой брони.",
  icon: "/skills/skill0231.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1900, mpCost: 0, power: 1.9 },
    { level: 2, requiredLevel: 20, spCost: 1900, mpCost: 0, power: 3.3 },
    { level: 3, requiredLevel: 24, spCost: 3500, mpCost: 0, power: 4.8 },
    { level: 4, requiredLevel: 24, spCost: 3500, mpCost: 0, power: 6.4 },
    { level: 5, requiredLevel: 28, spCost: 4400, mpCost: 0, power: 8.1 },
    { level: 6, requiredLevel: 28, spCost: 4400, mpCost: 0, power: 8.9 },
    { level: 7, requiredLevel: 28, spCost: 4400, mpCost: 0, power: 9.8 },
    { level: 8, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 11.7 },
    { level: 9, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 12.7 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 13.7 },
    { level: 11, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 15.8 },
    { level: 12, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 16.9 },
    { level: 13, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 18 },
  ],
};

