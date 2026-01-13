import { SkillDefinition } from "../../../types";

const levels = [
  { level: 3, requiredLevel: 40, spCost: 39000, mpCost: 0, power: 70 },
  { level: 4, requiredLevel: 48, spCost: 85000, mpCost: 0, power: 100 },
  { level: 5, requiredLevel: 56, spCost: 140000, mpCost: 0, power: 140 },
  { level: 6, requiredLevel: 60, spCost: 250000, mpCost: 0, power: 152 },
  { level: 7, requiredLevel: 66, spCost: 700000, mpCost: 0, power: 180 },
  { level: 8, requiredLevel: 72, spCost: 1400000, mpCost: 0, power: 200 }
];

export const skill_1202: SkillDefinition = {
  id: 213,
  code: "DME_0213",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальный MP.",
  icon: "/skills/skill0213.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",

  levels,
};
