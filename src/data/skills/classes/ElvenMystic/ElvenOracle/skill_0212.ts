import { SkillDefinition } from "../../../types";

// Boost Mana - increases maximum MP
// З XML: levels="8", mp: 30-200
// Для Elven Oracle: рівні 1-2 (requiredLevel: 20, 30)
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "EO_0212",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальный MP на 30-50 (зависит от уровня).",
  icon: "/skills/skill0213.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxMp", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 0, power: 30 },
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 0, power: 50 },
  ],
};

