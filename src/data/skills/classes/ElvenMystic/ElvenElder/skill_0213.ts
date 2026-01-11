import { SkillDefinition } from "../../../types";

// Fast HP Recovery - increases HP recovery speed (continuation for Elven Elder)
// З XML: levels="8", hp: 1.1-4.0
// Для Elven Elder: рівні 2-6 (requiredLevel: 44-74)
export const skill_0213: SkillDefinition = {
  id: 213,
  code: "EE_0213",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУскоряет регенерацию HP на 1.6-2.7 HP/сек (зависит от уровня).",
  icon: "/skills/skill0213.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" },
  ],
  levels: [
    { level: 2, requiredLevel: 44, spCost: 41000, mpCost: 0, power: 1.6 },
    { level: 3, requiredLevel: 52, spCost: 100000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 58, spCost: 160000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 64, spCost: 340000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 74, spCost: 1600000, mpCost: 0, power: 2.7 },
  ],
};













