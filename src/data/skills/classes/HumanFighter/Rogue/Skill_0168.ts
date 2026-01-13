import { SkillDefinition } from "../../../types";

export const Skill_0168: SkillDefinition = {
  id: 168,
  code: "HF_0168",
  name: "Boost Attack Speed",
  description: "Attack speed increases.\n\nУвеличивает скорость атаки.",
  icon: "/skills/skill0168.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
  {
    "stat": "attackSpeed",
    "mode": "percent"
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 36,
    "spCost": 31000,
    "mpCost": 0,
    "power": 5
  }
]
};
