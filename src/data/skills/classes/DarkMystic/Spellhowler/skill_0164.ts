import { SkillDefinition } from "../../../types";

// Quick Recovery - 3 levels (passive)
// Reduces cooldown by 10%, 20%, 30% (multipliers: 0.9, 0.8, 0.7)
export const skill_0164: SkillDefinition = {
  id: 164,
  code: "SP_0164",
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

