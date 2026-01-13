import { SkillDefinition } from "../../../types";

export const Skill_0168: SkillDefinition = {
  id: 168,
  code: "HF_0168",
  name: "Boost Attack Speed",
  description: "Attack speed increases.\n\nУвеличивает скорость атаки.",
  icon: "/skills/skill0168.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "attackSpeed",
      mode: "percent",
    },
  ],
  levels: [
    { level: 2, requiredLevel: 46, spCost: 47000, mpCost: 0, power: 7 },
    { level: 3, requiredLevel: 58, spCost: 0, mpCost: 0, power: 10 },
  ],
};

