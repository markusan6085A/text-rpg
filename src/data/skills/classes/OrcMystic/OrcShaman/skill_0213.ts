import { SkillDefinition } from "../../../types";

// Boost Mana - passive skill that increases maximum MP
export const skill_0213: SkillDefinition = {
  id: 213,
  code: "OS_0213",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальный MP.",
  icon: "/skills/Skill0213_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxMp", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 0, power: 30 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 0, power: 50 },
  ],
};

