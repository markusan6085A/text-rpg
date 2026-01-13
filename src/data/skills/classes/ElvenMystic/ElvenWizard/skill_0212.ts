import { SkillDefinition } from "../../../types";

// Boost Mana - increases maximum MP
export const skill_0212: SkillDefinition = {
  id: 212,
  code: "EW_0212",
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

