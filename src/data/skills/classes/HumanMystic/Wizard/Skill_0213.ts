import { SkillDefinition } from "../../../types";

// Boost Mana
export const skill_0213: SkillDefinition = {
  id: 213,
  code: "HM_0213",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальный MP.",
  icon: "/skills/skill0213.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "maxMp", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 0, power: 30 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 0, power: 50 },
    { level: 3, requiredLevel: 40, spCost: 32000, mpCost: 0, power: 70 },
    { level: 4, requiredLevel: 48, spCost: 75000, mpCost: 0, power: 100 },
    { level: 5, requiredLevel: 56, spCost: 130000, mpCost: 0, power: 140 },
    { level: 6, requiredLevel: 62, spCost: 310000, mpCost: 0, power: 152 },
    { level: 7, requiredLevel: 68, spCost: 630000, mpCost: 0, power: 180 },
    { level: 8, requiredLevel: 74, spCost: 2600000, mpCost: 0, power: 200 },
  ],
};
