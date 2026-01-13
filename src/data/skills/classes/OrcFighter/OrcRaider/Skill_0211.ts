import { SkillDefinition } from "../../../types";

export const Skill_0211: SkillDefinition = {
  id: 211,
  code: "OR_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP.\n\nУвеличивает максимальное HP.",
  icon: "/skills/skill0211.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxHp", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3400, mpCost: 0, power: 60 },
    { level: 2, requiredLevel: 28, spCost: 11000, mpCost: 0, power: 100 },
    { level: 3, requiredLevel: 36, spCost: 17000, mpCost: 0, power: 150 },
  ],
};

