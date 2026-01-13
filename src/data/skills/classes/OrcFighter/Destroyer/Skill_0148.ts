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
    { stat: "mpRegen", mode: "flat" },
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 33000, mpCost: 0, power: 2.9 }, // hpRegen: 2.9, mpRegen: 1.2
    { level: 4, requiredLevel: 46, spCost: 50000, mpCost: 0, power: 3.6 }, // hpRegen: 3.6, mpRegen: 1.5
    { level: 5, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 4.5 }, // hpRegen: 4.5, mpRegen: 1.7
    { level: 6, requiredLevel: 58, spCost: 200000, mpCost: 0, power: 4.7 }, // hpRegen: 4.7, mpRegen: 1.8
    { level: 7, requiredLevel: 64, spCost: 400000, mpCost: 0, power: 5.6 }, // hpRegen: 5.6, mpRegen: 2.1
    { level: 8, requiredLevel: 72, spCost: 1300000, mpCost: 0, power: 6.7 }, // hpRegen: 6.7, mpRegen: 2.5
  ],
};

