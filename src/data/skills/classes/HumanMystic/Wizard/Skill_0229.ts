import { SkillDefinition } from "../../../types";

// Fast Mana Recovery
export const skill_0229: SkillDefinition = {
  id: 229,
  code: "HM_0229",
  name: "Fast Mana Recovery",
  description: "Increases MP regeneration.\n\nУвеличивает регенерацию MP.",
  icon: "/skills/skill0229.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5500, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 0, power: 1.5 },
    { level: 3, requiredLevel: 44, spCost: 41000, mpCost: 0, power: 1.9 },
    { level: 4, requiredLevel: 52, spCost: 110000, mpCost: 0, power: 2.3 },
    { level: 5, requiredLevel: 58, spCost: 180000, mpCost: 0, power: 2.7 },
    { level: 6, requiredLevel: 64, spCost: 480000, mpCost: 0, power: 3.1 },
    { level: 7, requiredLevel: 70, spCost: 1630000, mpCost: 0, power: 3.4 },
  ],
};
