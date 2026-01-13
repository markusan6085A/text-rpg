import { SkillDefinition } from "../../../types";

// Fast HP Recovery - increases HP regeneration
// З XML: levels="8", hp: 1.1-4.0
// Для Elven Oracle: рівень 1 (requiredLevel: 35)
export const skill_0213: SkillDefinition = {
  id: 213,
  code: "EO_0213",
  name: "Fast HP Recovery",
  description: "Increases HP regeneration.\n\nУскоряет регенерацию HP на 1.1 HP/сек (зависит от уровня).",
  icon: "/skills/skill0213.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 0, power: 1.1 },
  ],
};

