import { SkillDefinition } from "../../../types";

export const Skill_0168: SkillDefinition = {
  id: 168,
  code: "OM_0168",
  name: "Boost Attack Speed",
  description: "Attack speed increases.\n\nСкорость атаки увеличивается.",
  icon: "/skills/skill0168.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.05 },
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 39000, mpCost: 0, power: 5 },
  ],
};

