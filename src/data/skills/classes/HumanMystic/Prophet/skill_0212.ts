import { SkillDefinition } from "../../../types";

export const skill_0212: SkillDefinition = {
  id: 212,
  code: "HM_0212",
  name: "Fast HP Recovery",
  description: "Increases HP regeneration rate while active.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/Skill0212.gif",
  category: "passive",
  target: "self",
  scope: "single",
  powerType: "percent",
  effects: [{ stat: "hpRegen", mode: "percent" }],
  stackType: "fast_hp_recovery",
  stackOrder: 2,
  levels: [
    { level: 2, requiredLevel: 44, spCost: 39000, mpCost: 0, power: 1.6 },
    { level: 3, requiredLevel: 52, spCost: 100000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 58, spCost: 220000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 64, spCost: 480000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 74, spCost: 2600000, mpCost: 0, power: 2.7 },
  ],
};


