import { SkillDefinition } from "../../../types";

// Boost HP - passive skill that increases maximum HP
export const skill_0211: SkillDefinition = {
  id: 211,
  code: "OL_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP.\n\nУвеличивает максимальное количество HP.",
  icon: "/skills/skill0211.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxHp", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 0, power: 60 },
    { level: 2, requiredLevel: 44, spCost: 28000, mpCost: 0, power: 100 },
    { level: 3, requiredLevel: 48, spCost: 40000, mpCost: 0, power: 150 },
    { level: 4, requiredLevel: 52, spCost: 65000, mpCost: 0, power: 200 },
    { level: 5, requiredLevel: 56, spCost: 67000, mpCost: 0, power: 250 },
  ],
};

