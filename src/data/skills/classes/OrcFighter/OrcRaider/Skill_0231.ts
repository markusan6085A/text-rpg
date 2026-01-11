import { SkillDefinition } from "../../../types";

export const Skill_0231: SkillDefinition = {
  id: 231,
  code: "OR_0231",
  name: "Heavy Armor Mastery",
  description: "Increases P. Def. when wearing heavy armor.\n\nУвеличивает физ. защиту при ношении тяжелой брони.",
  icon: "/skills/skill0231.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1700, mpCost: 0, power: 1.9 },
    { level: 2, requiredLevel: 20, spCost: 1700, mpCost: 0, power: 3.3 },
    { level: 3, requiredLevel: 24, spCost: 2700, mpCost: 0, power: 4.8 },
    { level: 4, requiredLevel: 24, spCost: 2700, mpCost: 0, power: 6.4 },
    { level: 5, requiredLevel: 28, spCost: 3600, mpCost: 0, power: 8.1 },
    { level: 6, requiredLevel: 28, spCost: 3600, mpCost: 0, power: 8.9 },
    { level: 7, requiredLevel: 28, spCost: 3600, mpCost: 0, power: 9.8 },
    { level: 8, requiredLevel: 32, spCost: 5600, mpCost: 0, power: 11.7 },
    { level: 9, requiredLevel: 32, spCost: 5600, mpCost: 0, power: 12.7 },
    { level: 10, requiredLevel: 32, spCost: 5600, mpCost: 0, power: 13.7 },
    { level: 11, requiredLevel: 36, spCost: 8600, mpCost: 0, power: 15.8 },
    { level: 12, requiredLevel: 36, spCost: 8600, mpCost: 0, power: 16.9 },
    { level: 13, requiredLevel: 36, spCost: 8600, mpCost: 0, power: 18 },
  ],
};

