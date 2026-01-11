import { SkillDefinition } from "../../../types";

// Weapon Mastery - increases attack power
export const skill_0141: SkillDefinition = {
  id: 141,
  code: "DKF_0141",
  name: "Weapon Mastery",
  description: "Increases P. Atk.\n\nУвеличивает физическую атаку.",
  icon: "/skills/skill0141.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.085 },
    { stat: "pAtk", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 160, mpCost: 0, power: 2 },
    { level: 2, requiredLevel: 10, spCost: 910, mpCost: 0, power: 3 },
    { level: 3, requiredLevel: 15, spCost: 2900, mpCost: 0, power: 4 },
  ],
};

