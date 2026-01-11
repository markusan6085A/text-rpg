import { SkillDefinition } from "../../../types";

// Boost Evasion - increases evasion
export const skill_0198: SkillDefinition = {
  id: 198,
  code: "ES_0198",
  name: "Boost Evasion",
  description: "Increase evasion.\n\nУвеличивает Evasion на 2.",
  icon: "/skills/skill0198.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "evasion", mode: "flat", value: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 0, power: 2 },
  ],
};

