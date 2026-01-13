import { SkillDefinition } from "../../../types";

// Heavy Armor Mastery - increases P. Def when wearing heavy armor
export const skill_0231: SkillDefinition = {
  id: 231,
  code: "EK_0231",
  name: "Heavy Armor Mastery",
  description: "Increases P. Def. when wearing heavy armor.\n\nУвеличивает физическую защиту при ношении тяжелой брони.",
  icon: "/skills/skill0231.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power (only for heavy armor)
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 17.7 },
    { level: 2, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 19.1 },
    { level: 3, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 20.5 },
    { level: 4, requiredLevel: 24, spCost: 2900, mpCost: 0, power: 23.5 },
    { level: 5, requiredLevel: 24, spCost: 2900, mpCost: 0, power: 25 },
    { level: 6, requiredLevel: 24, spCost: 2900, mpCost: 0, power: 26.7 },
    { level: 7, requiredLevel: 28, spCost: 5000, mpCost: 0, power: 30 },
    { level: 8, requiredLevel: 28, spCost: 5000, mpCost: 0, power: 31.8 },
    { level: 9, requiredLevel: 28, spCost: 5000, mpCost: 0, power: 33.6 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 37.4 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 39.3 },
    { level: 12, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 41.3 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 45.6 },
    { level: 14, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 47.7 },
    { level: 15, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 50 },
  ],
};

