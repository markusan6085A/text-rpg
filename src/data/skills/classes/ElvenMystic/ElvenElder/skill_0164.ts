import { SkillDefinition } from "../../../types";

// Quick Recovery - time between magic reuse shortens (continuation for Elven Elder)
// З XML: levels="3", reuse: 0.8-0.7
// Для Elven Elder: рівень 3 (requiredLevel: 48)
export const skill_0164: SkillDefinition = {
  id: 164,
  code: "EE_0164",
  name: "Quick Recovery",
  description: "Time between magic reuse shortens.\n\nСокращает время между повторным использованием магии на 30%.",
  icon: "/skills/skill0164.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "cooldownReduction", mode: "percent", value: 30 },
  ],
  levels: [
    { level: 3, requiredLevel: 48, spCost: 67000, mpCost: 0, power: 30 },
  ],
};













