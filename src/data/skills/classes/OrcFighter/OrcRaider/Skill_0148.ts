import { SkillDefinition } from "../../../types";

export const Skill_0148: SkillDefinition = {
  id: 148,
  code: "OR_0148",
  name: "Vital Force",
  description: "Allows quick recovery while one is sitting.\n\nПозволяет быстро восстанавливаться во время отдыха.",
  icon: "/skills/skill0148.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" },
    { stat: "mpRegen", mode: "flat", value: 0 }, // Will be set based on level
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5300, mpCost: 0, power: 1.9 }, // hpRegen: 1.9, mpRegen: 0.9
    { level: 2, requiredLevel: 32, spCost: 17000, mpCost: 0, power: 2.7 }, // hpRegen: 2.7, mpRegen: 1.1
  ],
};

