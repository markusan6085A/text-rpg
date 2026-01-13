import { SkillDefinition } from "../../../types";

export const skill_1072: SkillDefinition = {
  id: 1072,
  code: "HM_1072",
  name: "Sleeping Cloud",
  description: "Instantly puts nearby enemies to sleep. If cast on a sleeping target, the spell has no effect.",
  icon: "/skills/skill1072.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  levels: [
  {
    "level": 1,
    "requiredLevel": 44,
    "spCost": 43000,
    "mpCost": 59,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 56,
    "spCost": 110000,
    "mpCost": 77,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 62,
    "spCost": 250000,
    "mpCost": 87,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 66,
    "spCost": 410000,
    "mpCost": 93,
    "power": 0
  },
  {
    "level": 5,
    "requiredLevel": 70,
    "spCost": 590000,
    "mpCost": 98,
    "power": 0
  }
]
};

