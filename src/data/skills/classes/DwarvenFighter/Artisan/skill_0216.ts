import { SkillDefinition } from "../../../types";

// Polearm Mastery - increases P. Atk when using polearm
// XML: #pAtk: 4.5 7.3 8.9 10.7 12.8 15.1 17.7 20.5, #atkCountMax: 5 5 5 5 5 5 5 5
export const skill_0216: SkillDefinition = {
  id: 216,
  code: "AR_0216",
  name: "Polearm Mastery",
  description: "Increases P. Atk. when using a Polearm.\n\nУвеличивает физическую атаку при использовании копья.",
  icon: "/skills/skill0216.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" }, // Value from level.power
    { stat: "accuracy", mode: "flat", value: 5 }, // From description
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 0, power: 4.5 },
    { level: 2, requiredLevel: 24, spCost: 7000, mpCost: 0, power: 7.3 },
    { level: 3, requiredLevel: 28, spCost: 6700, mpCost: 0, power: 8.9 },
    { level: 4, requiredLevel: 28, spCost: 6700, mpCost: 0, power: 10.7 },
    { level: 5, requiredLevel: 32, spCost: 13000, mpCost: 0, power: 12.8 },
    { level: 6, requiredLevel: 32, spCost: 13000, mpCost: 0, power: 15.1 },
    { level: 7, requiredLevel: 36, spCost: 17000, mpCost: 0, power: 17.7 },
    { level: 8, requiredLevel: 36, spCost: 17000, mpCost: 0, power: 20.5 },
  ],
};

