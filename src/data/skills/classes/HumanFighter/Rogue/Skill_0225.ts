import { SkillDefinition } from "../../../types";

export const Skill_0225: SkillDefinition = {
  id: 225,
  code: "HF_0225",
  name: "Acrobatic Move",
  description: "Dodging abilities increase when running.\n\nСпособность к уклонению увеличивается при беге.",
  icon: "/skills/skill0225.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
  {
    "stat": "evasion",
    "mode": "flat"
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 11000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 24,
    "spCost": 0,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 28,
    "spCost": 0,
    "mpCost": 0,
    "power": 0
  }
]
};
