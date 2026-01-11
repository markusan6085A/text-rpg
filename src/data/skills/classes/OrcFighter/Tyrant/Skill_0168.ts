import { SkillDefinition } from "../../../types";

export const Skill_0168: SkillDefinition = {
  id: 168,
  code: "TY_0168",
  name: "Boost Attack Speed",
  description: "Attack speed increases.\n\nСкорость атаки увеличивается.",
  icon: "/skills/skill0168.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.07 },
  ],
  levels: [
    { level: 2, requiredLevel: 46, spCost: 60000, mpCost: 0, power: 7 },
    { level: 3, requiredLevel: 61, spCost: 240000, mpCost: 0, power: 10 },
  ],
};

