import { SkillDefinition } from "../../../types";

export const skill_1275: SkillDefinition = {
  id: 1275,
  code: "HM_1275",
  name: "Aura Bolt",
  description: "Launches a weak bolt of magical energy. MP consumption rate is low and Casting Speed is short. Power 26. Эффект Aura Bolt, кастуется на врагов, действует в пределах дальности 400: - Магическая атака силой 26.",
  icon: "/skills/skill1275.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: [
  {
    "level": 1,
    "requiredLevel": 40,
    "spCost": 34000,
    "mpCost": 18,
    "power": 26
  },
  {
    "level": 2,
    "requiredLevel": 44,
    "spCost": 43000,
    "mpCost": 20,
    "power": 29
  },
  {
    "level": 3,
    "requiredLevel": 48,
    "spCost": 67000,
    "mpCost": 23,
    "power": 33
  },
  {
    "level": 4,
    "requiredLevel": 52,
    "spCost": 100000,
    "mpCost": 24,
    "power": 36
  },
  {
    "level": 5,
    "requiredLevel": 56,
    "spCost": 110000,
    "mpCost": 27,
    "power": 39
  },
  {
    "level": 6,
    "requiredLevel": 58,
    "spCost": 150000,
    "mpCost": 28,
    "power": 41
  },
  {
    "level": 7,
    "requiredLevel": 60,
    "spCost": 180000,
    "mpCost": 28,
    "power": 43
  },
  {
    "level": 8,
    "requiredLevel": 62,
    "spCost": 250000,
    "mpCost": 29,
    "power": 45
  },
  {
    "level": 9,
    "requiredLevel": 64,
    "spCost": 300000,
    "mpCost": 30,
    "power": 46
  },
  {
    "level": 10,
    "requiredLevel": 66,
    "spCost": 410000,
    "mpCost": 32,
    "power": 48
  },
  {
    "level": 11,
    "requiredLevel": 68,
    "spCost": 430000,
    "mpCost": 33,
    "power": 50
  },
  {
    "level": 12,
    "requiredLevel": 70,
    "spCost": 590000,
    "mpCost": 33,
    "power": 51
  },
  {
    "level": 13,
    "requiredLevel": 72,
    "spCost": 940000,
    "mpCost": 34,
    "power": 53
  },
  {
    "level": 14,
    "requiredLevel": 74,
    "spCost": 1300000,
    "mpCost": 35,
    "power": 54
  }
]
};
