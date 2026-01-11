import { SkillDefinition } from "../../../types";

// Acrobatics - reduces falling damage
export const skill_0195: SkillDefinition = {
  id: 195,
  code: "ES_0195",
  name: "Acrobatics",
  description: "Reduces falling damage.\n\nУменьшает урон от падения на 60.",
  icon: "/skills/skill0195.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "fallResist", mode: "flat", value: 60 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 0, power: 60 },
  ],
};

