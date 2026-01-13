import { SkillDefinition } from "../../../types";

// Fast HP Recovery - continues from Elven Wizard level 1
export const skill_0249: SkillDefinition = {
  id: 249,
  code: "ES_0249",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУскоряет восстановление HP на 1.6-2.7 HP/сек (зависит от уровня).",
  icon: "/skills/skill0249.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" },
  ],
  levels: [
    { level: 2, requiredLevel: 44, spCost: 37000, mpCost: 0, power: 1.6 },
    { level: 3, requiredLevel: 52, spCost: 95000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 58, spCost: 120000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 64, spCost: 250000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 2.7 },
  ],
};

