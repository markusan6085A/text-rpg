import { SkillDefinition } from "../../../types";

// Cubic Mastery - Ability to summon 2 Cubics at once
export const skill_0143: SkillDefinition = {
  id: 143,
  code: "ES_0143",
  name: "Cubic Mastery",
  description: "Ability to summon 2 Cubics at once.\n\nПозволяет призывать одновременно 2 кубика(ов).",
  icon: "/skills/skill0143.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [], // Cubic mastery is handled by game logic, not by stat modifiers
  levels: [
    { level: 1, requiredLevel: 44, spCost: 44000, mpCost: 0, power: 0 },
    { level: 2, requiredLevel: 56, spCost: 110000, mpCost: 0, power: 0 },
  ],
};

