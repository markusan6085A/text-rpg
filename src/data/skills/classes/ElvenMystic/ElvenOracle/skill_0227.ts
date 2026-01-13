import { SkillDefinition } from "../../../types";

// Light Armor Mastery - increases P. Def. and Evasion when wearing light armor
// З XML: levels="50", pDef: 4.2-81.3, rEvas: 3-6
// Для Elven Oracle: рівні 1-8 (requiredLevel: 20-35)
export const skill_0227: SkillDefinition = {
  id: 227,
  code: "EO_0227",
  name: "Light Armor Mastery",
  description: "Increases P. Def. and Evasion when wearing light armor.\n\nУвеличивает физическую защиту при ношении легкой брони на 4.2-29.3 (зависит от уровня). Увеличивает уклонение на 3-6 (зависит от уровня).",
  icon: "/skills/skill0227.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  requiresArmor: "light", // Скіл працює тільки якщо надіта легка броня
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
    { stat: "evasion", mode: "flat" }, // Value from level (3-6)
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 4.2 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 5.3 },
    { level: 3, requiredLevel: 25, spCost: 3200, mpCost: 0, power: 6.5 },
    { level: 4, requiredLevel: 25, spCost: 3200, mpCost: 0, power: 7.7 },
    { level: 5, requiredLevel: 30, spCost: 6200, mpCost: 0, power: 9.0 },
    { level: 6, requiredLevel: 30, spCost: 6200, mpCost: 0, power: 9.9 },
    { level: 7, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 10.8 },
    { level: 8, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 12.7 },
  ],
};

