import { SkillDefinition } from "../../../types";

// Light Armor Mastery - increases P. Def and Evasion when wearing light armor
export const skill_0227: SkillDefinition = {
  id: 227,
  code: "AS_0227",
  name: "Light Armor Mastery",
  description: "Increases P. Def. when wearing light armor.\n\nУвеличивает физическую защиту при ношении легкой брони.",
  icon: "/skills/skill0227.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "percent" }, // Value from level.power
    { stat: "evasion", mode: "flat", value: 4 }, // Fixed value for levels 1-2
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 1.3 },
    { level: 2, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 2.2 },
    { level: 3, requiredLevel: 24, spCost: 2500, mpCost: 0, power: 3.2 },
    { level: 4, requiredLevel: 24, spCost: 2500, mpCost: 0, power: 4.2 },
    { level: 5, requiredLevel: 28, spCost: 4300, mpCost: 0, power: 5.3 },
    { level: 6, requiredLevel: 28, spCost: 4300, mpCost: 0, power: 6.8 },
    { level: 7, requiredLevel: 32, spCost: 7100, mpCost: 0, power: 8.4 },
    { level: 8, requiredLevel: 32, spCost: 7100, mpCost: 0, power: 10.1 },
    { level: 9, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 11.9 },
    { level: 10, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 13.7 },
  ],
};

