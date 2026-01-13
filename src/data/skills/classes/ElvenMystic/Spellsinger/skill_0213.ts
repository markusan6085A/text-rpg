import { SkillDefinition } from "../../../types";

// Higher Mana Gain - continues from Elven Wizard level 8
export const skill_0213: SkillDefinition = {
  id: 213,
  code: "ES_0213",
  name: "Higher Mana Gain",
  description: "Increases the recovery rate when MP is being recovered by recharge.\n\nУвеличивает восстановление для Recharge MP на 41-81% (зависит от уровня).",
  icon: "/skills/skill0213.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "percent" },
  ],
  levels: [
    { level: 9, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 41 },
    { level: 10, requiredLevel: 40, spCost: 14000, mpCost: 0, power: 42 },
    { level: 11, requiredLevel: 44, spCost: 18000, mpCost: 0, power: 48 },
    { level: 12, requiredLevel: 44, spCost: 18000, mpCost: 0, power: 49 },
    { level: 13, requiredLevel: 48, spCost: 30000, mpCost: 0, power: 50 },
    { level: 14, requiredLevel: 48, spCost: 30000, mpCost: 0, power: 52 },
    { level: 15, requiredLevel: 52, spCost: 47000, mpCost: 0, power: 53 },
    { level: 16, requiredLevel: 52, spCost: 47000, mpCost: 0, power: 59 },
    { level: 17, requiredLevel: 56, spCost: 48000, mpCost: 0, power: 61 },
    { level: 18, requiredLevel: 56, spCost: 48000, mpCost: 0, power: 62 },
    { level: 19, requiredLevel: 58, spCost: 120000, mpCost: 0, power: 64 },
    { level: 20, requiredLevel: 60, spCost: 150000, mpCost: 0, power: 66 },
    { level: 21, requiredLevel: 62, spCost: 210000, mpCost: 0, power: 72 },
    { level: 22, requiredLevel: 64, spCost: 250000, mpCost: 0, power: 73 },
    { level: 23, requiredLevel: 66, spCost: 350000, mpCost: 0, power: 75 },
    { level: 24, requiredLevel: 68, spCost: 390000, mpCost: 0, power: 76 },
    { level: 25, requiredLevel: 70, spCost: 470000, mpCost: 0, power: 78 },
    { level: 26, requiredLevel: 72, spCost: 790000, mpCost: 0, power: 79 },
    { level: 27, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 81 },
  ],
};

