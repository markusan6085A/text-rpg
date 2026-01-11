import { SkillDefinition } from "../../../types";

// Fast Mana Recovery - values from XML: +1.9, +2.3, +2.7, +3.1, +3.4 MP/sec (flat addition)
const levels = [
  { level: 3, requiredLevel: 44, spCost: 43000, mpCost: 0, power: 1.9 },
  { level: 4, requiredLevel: 52, spCost: 110000, mpCost: 0, power: 2.3 },
  { level: 5, requiredLevel: 60, spCost: 250000, mpCost: 0, power: 2.7 },
  { level: 6, requiredLevel: 68, spCost: 700000, mpCost: 0, power: 3.1 },
  { level: 7, requiredLevel: 74, spCost: 2100000, mpCost: 0, power: 3.4 }
];

export const skill_1216: SkillDefinition = {
  id: 229,
  code: "DME_0229",
  name: "Fast Mana Recovery",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость восстановления MP.",
  icon: "/skills/Skill1216_0.jpg",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  levels,
};
