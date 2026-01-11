import { SkillDefinition } from "../../../types";

// Quick Recovery - time between magic reuse shortens
export const skill_0164: SkillDefinition = {
  id: 164,
  code: "ES_0164",
  name: "Quick Recovery",
  description: "Time between magic reuse shortens.\n\nСокращает время перезарядки магии на 30% (зависит от уровня).",
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
    { level: 3, requiredLevel: 48, spCost: 60000, mpCost: 0, power: 30 },
  ],
};

