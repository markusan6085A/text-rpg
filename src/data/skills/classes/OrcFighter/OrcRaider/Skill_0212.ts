import { SkillDefinition } from "../../../types";

export const Skill_0212: SkillDefinition = {
  id: 212,
  code: "OR_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/skill0212.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5300, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 32, spCost: 17000, mpCost: 0, power: 1.6 },
  ],
};

