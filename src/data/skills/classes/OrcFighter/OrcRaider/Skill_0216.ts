import { SkillDefinition } from "../../../types";

export const Skill_0216: SkillDefinition = {
  id: 216,
  code: "OR_0216",
  name: "Polearm Mastery",
  description: "Increases P. Atk. when using a Polearm.\n\nУвеличивает физ. атаку при использовании копья.",
  icon: "/skills/skill0216.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
    { stat: "accuracy", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3400, mpCost: 0, power: 4.5 },
    { level: 2, requiredLevel: 24, spCost: 5300, mpCost: 0, power: 7.3 },
    { level: 3, requiredLevel: 28, spCost: 5500, mpCost: 0, power: 8.9 },
    { level: 4, requiredLevel: 28, spCost: 5500, mpCost: 0, power: 10.7 },
    { level: 5, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 12.8 },
    { level: 6, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 15.1 },
    { level: 7, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 17.7 },
    { level: 8, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 20.5 },
  ],
};

