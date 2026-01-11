import { SkillDefinition } from "../../../types";

export const skill_1234: SkillDefinition = {
  id: 1234,
  code: "HM_1234",
  name: "Vampiric Claw",
  description: "Dark magic attack that absorbs HP. Power 49. Absorbs 20% of damage dealt.\n\nТемная магическая атака, поглощающая HP. Сила 49. Поглощает 20% нанесенного урона.",
  icon: "/skills/skill1234.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  element: "dark",
  effects: [
  {
    "stat": "vampirism",
    "mode": "percent",
    "value": 20
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 40,
    "spCost": 16000,
    "mpCost": 50,
    "power": 49
  },
  {
    "level": 2,
    "requiredLevel": 40,
    "spCost": 16000,
    "mpCost": 53,
    "power": 52
  },
  {
    "level": 3,
    "requiredLevel": 44,
    "spCost": 18000,
    "mpCost": 55,
    "power": 55
  },
  {
    "level": 4,
    "requiredLevel": 44,
    "spCost": 18000,
    "mpCost": 59,
    "power": 58
  },
  {
    "level": 5,
    "requiredLevel": 48,
    "spCost": 27000,
    "mpCost": 62,
    "power": 61
  },
  {
    "level": 6,
    "requiredLevel": 48,
    "spCost": 27000,
    "mpCost": 65,
    "power": 65
  },
  {
    "level": 7,
    "requiredLevel": 52,
    "spCost": 39000,
    "mpCost": 68,
    "power": 68
  },
  {
    "level": 8,
    "requiredLevel": 52,
    "spCost": 39000,
    "mpCost": 70,
    "power": 72
  },
  {
    "level": 9,
    "requiredLevel": 56,
    "spCost": 42000,
    "mpCost": 74,
    "power": 75
  },
  {
    "level": 10,
    "requiredLevel": 56,
    "spCost": 42000,
    "mpCost": 77,
    "power": 78
  },
  {
    "level": 11,
    "requiredLevel": 58,
    "spCost": 50000,
    "mpCost": 79,
    "power": 80
  },
  {
    "level": 12,
    "requiredLevel": 58,
    "spCost": 50000,
    "mpCost": 80,
    "power": 82
  },
  {
    "level": 13,
    "requiredLevel": 60,
    "spCost": 65000,
    "mpCost": 82,
    "power": 84
  },
  {
    "level": 14,
    "requiredLevel": 60,
    "spCost": 65000,
    "mpCost": 83,
    "power": 85
  },
  {
    "level": 15,
    "requiredLevel": 62,
    "spCost": 91000,
    "mpCost": 85,
    "power": 87
  },
  {
    "level": 16,
    "requiredLevel": 62,
    "spCost": 91000,
    "mpCost": 87,
    "power": 89
  },
  {
    "level": 17,
    "requiredLevel": 64,
    "spCost": 100000,
    "mpCost": 88,
    "power": 90
  },
  {
    "level": 18,
    "requiredLevel": 64,
    "spCost": 100000,
    "mpCost": 89,
    "power": 92
  },
  {
    "level": 19,
    "requiredLevel": 66,
    "spCost": 150000,
    "mpCost": 90,
    "power": 94
  },
  {
    "level": 20,
    "requiredLevel": 66,
    "spCost": 150000,
    "mpCost": 93,
    "power": 96
  },
  {
    "level": 21,
    "requiredLevel": 68,
    "spCost": 170000,
    "mpCost": 94,
    "power": 97
  },
  {
    "level": 22,
    "requiredLevel": 68,
    "spCost": 170000,
    "mpCost": 95,
    "power": 99
  },
  {
    "level": 23,
    "requiredLevel": 70,
    "spCost": 200000,
    "mpCost": 97,
    "power": 100
  },
  {
    "level": 24,
    "requiredLevel": 70,
    "spCost": 200000,
    "mpCost": 98,
    "power": 102
  },
  {
    "level": 25,
    "requiredLevel": 72,
    "spCost": 310000,
    "mpCost": 99,
    "power": 104
  },
  {
    "level": 26,
    "requiredLevel": 72,
    "spCost": 310000,
    "mpCost": 100,
    "power": 105
  },
  {
    "level": 27,
    "requiredLevel": 74,
    "spCost": 460000,
    "mpCost": 102,
    "power": 107
  },
  {
    "level": 28,
    "requiredLevel": 74,
    "spCost": 460000,
    "mpCost": 103,
    "power": 108
  }
]
};

