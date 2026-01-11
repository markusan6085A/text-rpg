import { SkillDefinition } from "../../../types";

// Boost Mana - increases maximum MP (continues from Elven Wizard level 2)
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "ES_0212",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальный MP на 70-200 (зависит от уровня).",
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
    { level: 3, requiredLevel: 40, spCost: 28000, mpCost: 0, power: 70 },
    { level: 4, requiredLevel: 48, spCost: 60000, mpCost: 0, power: 100 },
    { level: 5, requiredLevel: 56, spCost: 95000, mpCost: 0, power: 140 },
    { level: 6, requiredLevel: 60, spCost: 150000, mpCost: 0, power: 152 },
    { level: 7, requiredLevel: 66, spCost: 350000, mpCost: 0, power: 180 },
    { level: 8, requiredLevel: 72, spCost: 790000, mpCost: 0, power: 200 },
  ],
};

