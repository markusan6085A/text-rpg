import { SkillDefinition } from "../../../types";

export const Skill_0295: SkillDefinition = {
  id: 295,
  code: "OF_0295",
  name: "Iron Body",
  description: "Resist damage from falling.\n\nСнижает урон от падения на 40%.",
  icon: "/skills/skill0295.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "fallResist", mode: "multiplier", multiplier: 0.6 },
  ],
  levels: [
    { level: 1, requiredLevel: 15, spCost: 4000, mpCost: 0, power: 0 },
  ],
};

