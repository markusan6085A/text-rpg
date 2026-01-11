import { SkillDefinition } from "../../../types";

export const Skill_0148: SkillDefinition = {
  id: 148,
  code: "HF_0148",
  name: "Vital Force",
  description: "Allows quick recovery while one is sitting.\n\nПозволяет быстро восстанавливаться во время отдыха.",
  icon: "/skills/skill0148.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    {
      "stat": "hpRegen",
      "mode": "flat"
    },
    {
      "stat": "mpRegen",
      "mode": "flat"
    }
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 0, mpCost: 0, power: 2.9 },
    { level: 4, requiredLevel: 42, spCost: 0, mpCost: 0, power: 3.6 },
    { level: 5, requiredLevel: 44, spCost: 0, mpCost: 0, power: 4.5 },
    { level: 6, requiredLevel: 46, spCost: 0, mpCost: 0, power: 4.7 },
    { level: 7, requiredLevel: 48, spCost: 0, mpCost: 0, power: 5.6 },
    { level: 8, requiredLevel: 50, spCost: 0, mpCost: 0, power: 6.7 },
  ],
};

