import { SkillDefinition } from "../../../types";

// Fast HP Recovery - 2 levels
// XML: #hp: 1.1 1.6
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "SC_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/skill0212.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "flat" }], // Value from level.power
  levels: [
    { level: 1, requiredLevel: 24, spCost: 7700, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 32, spCost: 25000, mpCost: 0, power: 1.6 },
  ],
};

