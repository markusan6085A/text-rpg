import { SkillDefinition } from "../../../types";

// Quick Recovery - time between magic reuse shortens
// З XML: levels="3", reuse: 0.8-0.7
// Для Elven Oracle: рівні 1-2 (requiredLevel: 20, 30)
export const skill_0164: SkillDefinition = {
  id: 164,
  code: "EO_0164",
  name: "Quick Recovery",
  description: "Time between magic reuse shortens.\n\nСокращает время между повторным использованием магии на 20-30% (зависит от уровня).",
  icon: "/skills/skill0164.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "cooldownReduction", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 0, power: 20 },
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 0, power: 25 },
  ],
};

