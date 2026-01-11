import { SkillDefinition } from "../../../types";

// Higher Mana Gain - increases the recovery rate when MP is being recovered by recharge
export const skill_0213: SkillDefinition = {
  id: 213,
  code: "EW_0213",
  name: "Higher Mana Gain",
  description: "Increases the recovery rate when MP is being recovered by recharge.\n\nУвеличивает восстановление для Recharge MP на 22-39% (зависит от уровня).",
  icon: "/skills/skill0213.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "percent" }, // Value from level.power (22-39%)
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 22 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 24 },
    { level: 3, requiredLevel: 25, spCost: 3100, mpCost: 0, power: 28 },
    { level: 4, requiredLevel: 25, spCost: 3100, mpCost: 0, power: 29 },
    { level: 5, requiredLevel: 30, spCost: 5800, mpCost: 0, power: 31 },
    { level: 6, requiredLevel: 30, spCost: 5800, mpCost: 0, power: 32 },
    { level: 7, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 38 },
    { level: 8, requiredLevel: 35, spCost: 10000, mpCost: 0, power: 39 },
  ],
};

