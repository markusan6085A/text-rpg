import { SkillDefinition } from "../../../types";

// Vital Force - allows quick recovery while sitting
// XML: #hp: 1.9 2.7, #mp: 0.9 1.1
export const skill_0148: SkillDefinition = {
  id: 148,
  code: "AR_0148",
  name: "Vital Force",
  description: "Allows quick recovery while one is sitting.\n\nПозволяет быстрое восстановление во время сидения.",
  icon: "/skills/skill0148.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" }, // Value from level.power (hp regen)
    { stat: "mpRegen", mode: "flat", value: 0 }, // Will be set based on level (0.9 for level 1, 1.1 for level 2)
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 7000, mpCost: 0, power: 1.9 }, // hp regen: 1.9, mp regen: 0.9
    { level: 2, requiredLevel: 32, spCost: 25000, mpCost: 0, power: 2.7 }, // hp regen: 2.7, mp regen: 1.1
  ],
};

