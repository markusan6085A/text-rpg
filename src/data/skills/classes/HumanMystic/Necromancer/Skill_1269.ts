import { SkillDefinition } from "../../../types";

export const skill_1269: SkillDefinition = {
  id: 1269,
  code: "HM_1269",
  name: "Curse Disease",
  description: "Curse that temporarily reduces effectiveness of enemy's HP recovery magic. Р”РµР±",
  icon: "/skills/skill1269.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  duration: 120,
  chance: 80,
  effects: [
  {
    "stat": "attackSpeed",
    "mode": "percent",
    "value": -20
  },
  {
    "stat": "runSpeed",
    "mode": "percent",
    "value": -10
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 58,
    "spCost": 100000,
    "mpCost": 54,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 60,
    "spCost": 130000,
    "mpCost": 55,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 62,
    "spCost": 180000,
    "mpCost": 58,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 64,
    "spCost": 200000,
    "mpCost": 60,
    "power": 0
  },
  {
    "level": 5,
    "requiredLevel": 66,
    "spCost": 300000,
    "mpCost": 62,
    "power": 0
  },
  {
    "level": 6,
    "requiredLevel": 68,
    "spCost": 330000,
    "mpCost": 64,
    "power": 0
  },
  {
    "level": 7,
    "requiredLevel": 70,
    "spCost": 410000,
    "mpCost": 65,
    "power": 0
  },
  {
    "level": 8,
    "requiredLevel": 72,
    "spCost": 610000,
    "mpCost": 67,
    "power": 0
  },
  {
    "level": 9,
    "requiredLevel": 74,
    "spCost": 920000,
    "mpCost": 69,
    "power": 0
  }
]
};

