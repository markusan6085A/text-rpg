import { SkillDefinition } from "../../../types";

export const skill_1263: SkillDefinition = {
  id: 1263,
  code: "HM_1263",
  name: "Curse Gloom",
  description: "Curse that decreases enemy's M. Def. Effect 3. Р”РµР±",
  icon: "/skills/skill1263.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 30,
  chance: 80,
  effects: [
  {
    "stat": "mDef",
    "mode": "percent",
    "value": -25
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 44,
    "spCost": 35000,
    "mpCost": 39,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 48,
    "spCost": 55000,
    "mpCost": 44,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 52,
    "spCost": 78000,
    "mpCost": 48,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 56,
    "spCost": 83000,
    "mpCost": 52,
    "power": 0
  },
  {
    "level": 5,
    "requiredLevel": 58,
    "spCost": 100000,
    "mpCost": 54,
    "power": 0
  },
  {
    "level": 6,
    "requiredLevel": 60,
    "spCost": 130000,
    "mpCost": 55,
    "power": 0
  },
  {
    "level": 7,
    "requiredLevel": 62,
    "spCost": 180000,
    "mpCost": 58,
    "power": 0
  },
  {
    "level": 8,
    "requiredLevel": 64,
    "spCost": 200000,
    "mpCost": 60,
    "power": 0
  },
  {
    "level": 9,
    "requiredLevel": 66,
    "spCost": 300000,
    "mpCost": 62,
    "power": 0
  },
  {
    "level": 10,
    "requiredLevel": 68,
    "spCost": 330000,
    "mpCost": 64,
    "power": 0
  },
  {
    "level": 11,
    "requiredLevel": 70,
    "spCost": 410000,
    "mpCost": 65,
    "power": 0
  },
  {
    "level": 12,
    "requiredLevel": 72,
    "spCost": 610000,
    "mpCost": 67,
    "power": 0
  },
  {
    "level": 13,
    "requiredLevel": 74,
    "spCost": 920000,
    "mpCost": 69,
    "power": 0
  }
]
};

