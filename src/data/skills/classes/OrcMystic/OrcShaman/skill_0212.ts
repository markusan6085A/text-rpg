import { SkillDefinition } from "../../../types";

// Fast HP Recovery - passive skill that increases HP regeneration
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "OS_0212",
  name: "Fast HP Recovery",
  description: "Increases HP regeneration.\n\nУвеличивает скорость регенерации HP.",
  icon: "/skills/Skill0212_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 18000, mpCost: 0, power: 1.1 },
  ],
};

