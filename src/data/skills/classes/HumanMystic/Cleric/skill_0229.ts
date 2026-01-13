import { SkillDefinition } from "../../../types";

export const skill_0229: SkillDefinition = {
  id: 229,
  code: "HM_0229",
  name: "  MP",
  description: "Описание умения.",
  icon: "/skills/skill0229.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  stackType: "fast_mana_recovery",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6900, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 35, spCost: 21000, mpCost: 0, power: 1.5 },
  ],
};

