import { SkillDefinition } from "../../../types";

// Fast Mana Recovery - increases MP Recovery Speed (continuation for Elven Elder)
// З XML: levels="7", mp: 1.1-3.4
// Для Elven Elder: рівні 3-7 (requiredLevel: 44-74)
export const skill_0229: SkillDefinition = {
  id: 229,
  code: "EE_0229",
  name: "Fast Mana Recovery",
  description: "Increases MP Recovery Speed.\n\nУскоряет регенерацию MP на 1.9-3.4 MP/сек (зависит от уровня).",
  icon: "/skills/skill0229.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" },
  ],
  levels: [
    { level: 3, requiredLevel: 44, spCost: 41000, mpCost: 0, power: 1.9 },
    { level: 4, requiredLevel: 52, spCost: 100000, mpCost: 0, power: 2.3 },
    { level: 5, requiredLevel: 60, spCost: 210000, mpCost: 0, power: 2.7 },
    { level: 6, requiredLevel: 68, spCost: 590000, mpCost: 0, power: 3.1 },
    { level: 7, requiredLevel: 74, spCost: 1600000, mpCost: 0, power: 3.4 },
  ],
};













