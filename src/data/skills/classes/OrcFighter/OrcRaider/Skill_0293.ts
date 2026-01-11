import { SkillDefinition } from "../../../types";

export const Skill_0293: SkillDefinition = {
  id: 293,
  code: "OR_0293",
  name: "Two-handed Weapon Mastery",
  description: "Increases P. Atk. and Accuracy when one is using a two-handed type sword or a two-handed type blunt weapon.\n\nУвеличивает физ. атаку и точность при использовании двуручного меча или двуручной дубины.",
  icon: "/skills/skill0293.gif",
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
    { level: 3, requiredLevel: 28, spCost: 11000, mpCost: 0, power: 10.7 },
    { level: 4, requiredLevel: 32, spCost: 17000, mpCost: 0, power: 15.1 },
    { level: 5, requiredLevel: 36, spCost: 17000, mpCost: 0, power: 20.5 },
  ],
};

