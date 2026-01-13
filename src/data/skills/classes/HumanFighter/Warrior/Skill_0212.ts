import { SkillDefinition } from "../../../types";

export const Skill_0212: SkillDefinition = {
  id: 212,
  code: "WR_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed. -\n\nУвеличивает скорость восстановления HP.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "percent" }],
  stackType: "hp_regen_passive",
  stackOrder: 1,
  icon: "/skills/Skill0212.gif",
  levels: [
    { level: 1, requiredLevel: 24, spCost: 6400, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 36, spCost: 18000, mpCost: 0, power: 1.6 },
  ],
};

