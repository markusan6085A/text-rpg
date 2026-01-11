import { SkillDefinition } from "../../../types";

export const skill_1296: SkillDefinition = {
  id: 1296,
  code: "HM_1296",
  name: "Rain of Fire",
  description: "Flaming hail attack, useful against multiple enemies. Power 41. Атака огнем, кастуется на врагов, действует на врагов в радиусе 100 вокруг выбранной цели в пределах дальности 500: - Магическая атака силой 41.",
  icon: "/skills/skill1296.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 5,
  cooldown: 20,
  levels: [
  {
    "level": 1,
    "requiredLevel": 58,
    "spCost": 150000,
    "mpCost": 54,
    "power": 41
  },
  {
    "level": 2,
    "requiredLevel": 60,
    "spCost": 180000,
    "mpCost": 55,
    "power": 43
  },
  {
    "level": 3,
    "requiredLevel": 62,
    "spCost": 250000,
    "mpCost": 58,
    "power": 45
  },
  {
    "level": 4,
    "requiredLevel": 64,
    "spCost": 300000,
    "mpCost": 60,
    "power": 46
  },
  {
    "level": 5,
    "requiredLevel": 66,
    "spCost": 410000,
    "mpCost": 62,
    "power": 48
  },
  {
    "level": 6,
    "requiredLevel": 68,
    "spCost": 430000,
    "mpCost": 64,
    "power": 50
  },
  {
    "level": 7,
    "requiredLevel": 70,
    "spCost": 590000,
    "mpCost": 65,
    "power": 51
  },
  {
    "level": 8,
    "requiredLevel": 72,
    "spCost": 940000,
    "mpCost": 67,
    "power": 53
  },
  {
    "level": 9,
    "requiredLevel": 74,
    "spCost": 1300000,
    "mpCost": 69,
    "power": 54
  }
]
};
