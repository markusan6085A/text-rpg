import { SkillDefinition } from "../../../types";

// Robe Mastery - increases P. Def. when wearing a robe
// З XML: levels="8", pDef: 1.7-12.1
// Для Elven Oracle: рівні 1-8 (requiredLevel: 20-35)
export const skill_0234: SkillDefinition = {
  id: 234,
  code: "EO_0234",
  name: "Robe Mastery",
  description: "Increases P. Def. when wearing a robe.\n\nУвеличивает физическую защиту при ношении мантии на 1.7-12.1 (зависит от уровня).",
  icon: "/skills/skill0234.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 1.7 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 2.7 },
    { level: 3, requiredLevel: 25, spCost: 3200, mpCost: 0, power: 4.3 },
    { level: 4, requiredLevel: 25, spCost: 3200, mpCost: 0, power: 5.4 },
    { level: 5, requiredLevel: 30, spCost: 6200, mpCost: 0, power: 7.2 },
    { level: 6, requiredLevel: 30, spCost: 6200, mpCost: 0, power: 8.5 },
    { level: 7, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 10.6 },
    { level: 8, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 12.1 },
  ],
};

