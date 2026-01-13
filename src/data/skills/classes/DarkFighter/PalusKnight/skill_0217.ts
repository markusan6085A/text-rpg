import { SkillDefinition } from "../../../types";

// Sword Blunt Mastery - increases P. Atk when using sword or blunt weapon
export const skill_0217: SkillDefinition = {
  id: 217,
  code: "PK_0217",
  name: "Sword Blunt Mastery",
  description: "Increases P. Atk. when using a sword or blunt weapon.\n\nУвеличивает физическую атаку при использовании меча или дубины.",
  icon: "/skills/skill0217.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4700, mpCost: 0, power: 1.5 },
    { level: 2, requiredLevel: 24, spCost: 8800, mpCost: 0, power: 3.1 },
    { level: 3, requiredLevel: 28, spCost: 6700, mpCost: 0, power: 4.1 },
    { level: 4, requiredLevel: 28, spCost: 6700, mpCost: 0, power: 5.2 },
    { level: 5, requiredLevel: 32, spCost: 11000, mpCost: 0, power: 6.5 },
    { level: 6, requiredLevel: 32, spCost: 11000, mpCost: 0, power: 7.9 },
    { level: 7, requiredLevel: 36, spCost: 14000, mpCost: 0, power: 9.4 },
    { level: 8, requiredLevel: 36, spCost: 14000, mpCost: 0, power: 11.1 },
  ],
};

