import { SkillDefinition } from "../../../types";

// Boost Mana - increases maximum MP (continuation for Elven Elder)
// З XML: levels="8", mp: 30-200
// Для Elven Elder: рівні 3-8 (requiredLevel: 40-72)
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "EE_0212",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальный MP на 70-200 (зависит от уровня).",
  icon: "/skills/skill0213.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxMp", mode: "flat" },
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 34000, mpCost: 0, power: 70 },
    { level: 4, requiredLevel: 48, spCost: 67000, mpCost: 0, power: 100 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 0, power: 140 },
    { level: 6, requiredLevel: 60, spCost: 210000, mpCost: 0, power: 152 },
    { level: 7, requiredLevel: 66, spCost: 500000, mpCost: 0, power: 180 },
    { level: 8, requiredLevel: 72, spCost: 1100000, mpCost: 0, power: 200 },
  ],
};













