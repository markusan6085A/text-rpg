import { SkillDefinition } from "../../../types";

export const skill_0212: SkillDefinition = {
  id: 212,
  code: "HM_0212",
  name: "Fast HP Recovery",
  description: "Increases HP regeneration.\n\nУвеличивает регенерацию HP.",
  icon: "/skills/Skill0212.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 18000, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 44, spCost: 41000, mpCost: 0, power: 1.6 },
    { level: 3, requiredLevel: 52, spCost: 110000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 58, spCost: 180000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 64, spCost: 480000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 68, spCost: 630000, mpCost: 0, power: 2.7 },
    { level: 7, requiredLevel: 72, spCost: 1630000, mpCost: 0, power: 3.4 },
    { level: 8, requiredLevel: 76, spCost: 2100000, mpCost: 0, power: 4.0 },
  ],
};
