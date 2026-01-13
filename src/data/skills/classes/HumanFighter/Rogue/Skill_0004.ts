import { SkillDefinition } from "../../../types";

export const Skill_0004: SkillDefinition = {
  id: 4,
  code: "HF_0004",
  name: "Dash",
  description: "Temporary burst of speed.\n\nВременный всплеск скорости.",
  icon: "/skills/skill0004.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
  {
    "stat": "runSpeed",
    "mode": "flat"
  }
],
  castTime: 1,
  cooldown: 80,
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 3400,
    "mpCost": 10,
    "power": 40
  },
  {
    "level": 2,
    "requiredLevel": 24,
    "spCost": 0,
    "mpCost": 21,
    "power": 66
  }
]
};
