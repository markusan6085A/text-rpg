import { SkillDefinition } from "../../../types";

export const skill_0164: SkillDefinition = {
  id: 164,
  code: "HM_0164",
  name: "Quick Recovery",
  description: "Reduces skill cooldown time.\n\nСокращает время перезарядки скілов.",
  icon: "/skills/skill0164.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  effects: [{ stat: "cooldownReduction", mode: "multiplier" }],
  levels: [
    { level: 3, requiredLevel: 48, spCost: 63000, mpCost: 0, power: 0.7 }, // -30% CD
  ],
};

