import { SkillDefinition } from "../../../types";

// Vital Force - levels 3-8
// XML: #hp: 2.9 3.6 4.5 4.7 5.6 6.7, #mp: 1.2 1.5 1.7 1.8 2.1 2.5
export const skill_0148: SkillDefinition = {
  id: 148,
  code: "BH_0148",
  name: "Vital Force",
  description: "Allows quick recovery while one is sitting.\n\nПозволяет быстрое восстановление во время сидения.",
  icon: "/skills/skill0148.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" }, // Value from level.power (hp regen)
    { stat: "mpRegen", mode: "flat" }, // Value calculated from level index
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 43000, mpCost: 0, power: 2.9 }, // hp regen, mp regen = 1.2
    { level: 4, requiredLevel: 46, spCost: 67000, mpCost: 0, power: 3.6 }, // hp regen, mp regen = 1.5
    { level: 5, requiredLevel: 52, spCost: 180000, mpCost: 0, power: 4.5 }, // hp regen, mp regen = 1.7
    { level: 6, requiredLevel: 58, spCost: 300000, mpCost: 0, power: 4.7 }, // hp regen, mp regen = 1.8
    { level: 7, requiredLevel: 64, spCost: 600000, mpCost: 0, power: 5.6 }, // hp regen, mp regen = 2.1
    { level: 8, requiredLevel: 72, spCost: 1700000, mpCost: 0, power: 6.7 }, // hp regen, mp regen = 2.5
  ],
};

