import { SkillDefinition } from "../../../types";

// Fast HP Recovery - levels 3-8
// XML: #hp: 1.7 2.1 2.6 2.7 3.4 4
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "BH_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/skill0212.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "flat" }], // Value from level.power
  levels: [
    { level: 3, requiredLevel: 40, spCost: 43000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 43, spCost: 46000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 52, spCost: 180000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 58, spCost: 300000, mpCost: 0, power: 2.7 },
    { level: 7, requiredLevel: 68, spCost: 870000, mpCost: 0, power: 3.4 },
    { level: 8, requiredLevel: 74, spCost: 2300000, mpCost: 0, power: 4 },
  ],
};

