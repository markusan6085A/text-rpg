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
  stackType: "fast_hp_recovery",
  stackOrder: 1,
  levels: [{ level: 1, requiredLevel: 35, spCost: 21000, mpCost: 0, power: 1.1 }],
};

