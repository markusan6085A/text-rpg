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
    { stat: "accuracy", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 6, requiredLevel: 40, spCost: 33000, mpCost: 0, power: 27.1 },
    { level: 7, requiredLevel: 43, spCost: 38000, mpCost: 0, power: 32.9 },
    { level: 8, requiredLevel: 46, spCost: 50000, mpCost: 0, power: 39.4 },
    { level: 9, requiredLevel: 49, spCost: 82000, mpCost: 0, power: 46.6 },
    { level: 10, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 54.6 },
    { level: 11, requiredLevel: 55, spCost: 180000, mpCost: 0, power: 63.3 },
    { level: 12, requiredLevel: 58, spCost: 200000, mpCost: 0, power: 72.7 },
    { level: 13, requiredLevel: 60, spCost: 240000, mpCost: 0, power: 79.3 },
    { level: 14, requiredLevel: 62, spCost: 310000, mpCost: 0, power: 86.1 },
    { level: 15, requiredLevel: 64, spCost: 400000, mpCost: 0, power: 93.1 },
    { level: 16, requiredLevel: 66, spCost: 580000, mpCost: 0, power: 100.2 },
    { level: 17, requiredLevel: 68, spCost: 650000, mpCost: 0, power: 107.5 },
    { level: 18, requiredLevel: 70, spCost: 720000, mpCost: 0, power: 114.8 },
    { level: 19, requiredLevel: 72, spCost: 1300000, mpCost: 0, power: 122.1 },
    { level: 20, requiredLevel: 74, spCost: 1800000, mpCost: 0, power: 129.3 },
  ],
};

