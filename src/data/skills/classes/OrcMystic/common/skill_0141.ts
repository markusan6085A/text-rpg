import { SkillDefinition } from "../../../types";

// Weapon Mastery - passive skill that increases P. Atk. and M. Atk.
export const skill_0141: SkillDefinition = {
  id: 141,
  code: "OM_0141",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физическую и магическую атаку.",
  icon: "/skills/Skill0141_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
    { stat: "mAtk", mode: "flat" },
    { stat: "pAtk", mode: "percent", value: 45 },
    { stat: "mAtk", mode: "percent", value: 17 },
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 0, power: 2 },
    { level: 2, requiredLevel: 14, spCost: 1800, mpCost: 0, power: 3 },
  ],
};

