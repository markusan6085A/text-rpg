import { SkillDefinition } from "../../../types";

const levels = [
  { level: 2, requiredLevel: 44, spCost: 43000, mpCost: 0, power: 1.6 },
  { level: 3, requiredLevel: 52, spCost: 110000, mpCost: 0, power: 1.7 },
  { level: 4, requiredLevel: 58, spCost: 180000, mpCost: 0, power: 2.1 },
  { level: 5, requiredLevel: 64, spCost: 480000, mpCost: 0, power: 2.6 },
  { level: 6, requiredLevel: 74, spCost: 2100000, mpCost: 0, power: 2.7 }
];

export const skill_1215: SkillDefinition = {
  id: 1215,
  code: "DME_1215",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/Skill0212.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "percent" }],
  levels,
};
