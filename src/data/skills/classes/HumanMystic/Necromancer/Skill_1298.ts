import { SkillDefinition } from "../../../types";

export const skill_1298: SkillDefinition = {
  id: 1298,
  code: "HM_1298",
  name: "Mass Slow",
  description: "Temporarily reduces the movement speed of nearby enemies. Effect 3. Р”РµР±",
  icon: "/skills/skill1298.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 120,
  chance: 80,
  effects: [
  {
    "stat": "runSpeed",
    "mode": "percent",
    "value": -50
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 62,
    "spCost": 91000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 62,
    "spCost": 91000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 64,
    "spCost": 100000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 64,
    "spCost": 100000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 5,
    "requiredLevel": 66,
    "spCost": 150000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 6,
    "requiredLevel": 66,
    "spCost": 150000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 7,
    "requiredLevel": 68,
    "spCost": 170000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 8,
    "requiredLevel": 68,
    "spCost": 170000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 9,
    "requiredLevel": 70,
    "spCost": 200000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 10,
    "requiredLevel": 70,
    "spCost": 200000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 11,
    "requiredLevel": 72,
    "spCost": 310000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 12,
    "requiredLevel": 72,
    "spCost": 310000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 13,
    "requiredLevel": 74,
    "spCost": 460000,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 14,
    "requiredLevel": 74,
    "spCost": 460000,
    "mpCost": 0,
    "power": 0
  }
]
};

