import { SkillDefinition } from "../../../types";

export const Skill_0198: SkillDefinition = {
  id: 198,
  code: "HF_0198",
  name: "Boost Evasion",
  description: "Increase evasion.\n\nУвеличивает уклонение.",
  icon: "/skills/skill0198.gif",
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
    "requiredLevel": 24,
    "spCost": 5900,
    "mpCost": 0,
    "power": 2
  }
]
};
