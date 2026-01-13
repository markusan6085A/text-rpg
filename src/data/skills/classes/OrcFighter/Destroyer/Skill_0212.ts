import { SkillDefinition } from "../../../types";

export const Skill_0212: SkillDefinition = {
  id: 212,
  code: "OR_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/skill0212.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" },
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 33000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 43, spCost: 38000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 58, spCost: 200000, mpCost: 0, power: 2.7 },
    { level: 7, requiredLevel: 68, spCost: 650000, mpCost: 0, power: 3.4 },
    { level: 8, requiredLevel: 74, spCost: 1800000, mpCost: 0, power: 4 },
  ],
};

