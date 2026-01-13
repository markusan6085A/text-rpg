import { SkillDefinition } from "../../../types";

// Cubic Mastery - ability to summon multiple Cubics at once
export const skill_0143: SkillDefinition = {
  id: 143,
  code: "SK_0143",
  name: "Cubic Mastery",
  description: "Ability to summon 2 Cubics at once.\n\nСпособность призывать 2 кубика одновременно.",
  icon: "/skills/skill0143.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 32000, mpCost: 0, power: 0 }, // Allows 2 cubics
    { level: 2, requiredLevel: 55, spCost: 130000, mpCost: 0, power: 0 }, // Allows 3 cubics
  ],
};

