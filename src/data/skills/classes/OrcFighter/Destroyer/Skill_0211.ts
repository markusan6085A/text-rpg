import { SkillDefinition } from "../../../types";

export const Skill_0211: SkillDefinition = {
  id: 211,
  code: "OR_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP.\n\nУвеличивает максимальное HP.",
  icon: "/skills/skill0211.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxHp", mode: "flat" },
  ],
  levels: [
    { level: 4, requiredLevel: 43, spCost: 38000, mpCost: 0, power: 200 },
    { level: 5, requiredLevel: 49, spCost: 82000, mpCost: 0, power: 250 },
    { level: 6, requiredLevel: 55, spCost: 180000, mpCost: 0, power: 300 },
    { level: 7, requiredLevel: 62, spCost: 310000, mpCost: 0, power: 350 },
    { level: 8, requiredLevel: 66, spCost: 580000, mpCost: 0, power: 400 },
    { level: 9, requiredLevel: 70, spCost: 720000, mpCost: 0, power: 440 },
    { level: 10, requiredLevel: 74, spCost: 1800000, mpCost: 0, power: 480 },
  ],
};

