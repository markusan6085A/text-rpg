import { SkillDefinition } from "../../../types";

// Quick Recovery
export const skill_0164: SkillDefinition = {
  id: 164,
  code: "HM_0164",
  name: "Quick Recovery",
  description: "Time between magic reuse shortens.\n\nСокращает время перезарядки магических навыков.",
  icon: "/skills/skill0164.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  effects: [{ stat: "cooldownReduction", mode: "multiplier" }],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 0, power: 0.9 }, // -10% CD
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 0, power: 0.8 }, // -20% CD
  ],
};
