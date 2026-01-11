import { SkillDefinition } from "../../../types";

export const skill_1220: SkillDefinition = {
  id: 1220,
  code: "HM_1220",
  name: "Blaze",
  description: "Causes your body to erupt in flames to send a ball of fire towards your target. Power 23.\n\nЗаставляет ваше тело извергать пламя, отправляя огненный шар в цель. Сила 23. Атака огнем, кастуется на врагов, действует в пределах дальности 750. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1220.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 1400,
    "mpCost": 18,
    "power": 23
  },
  {
    "level": 2,
    "requiredLevel": 20,
    "spCost": 1400,
    "mpCost": 20,
    "power": 26
  },
  {
    "level": 3,
    "requiredLevel": 25,
    "spCost": 2800,
    "mpCost": 22,
    "power": 29
  },
  {
    "level": 4,
    "requiredLevel": 25,
    "spCost": 2800,
    "mpCost": 23,
    "power": 32
  },
  {
    "level": 5,
    "requiredLevel": 30,
    "spCost": 5300,
    "mpCost": 25,
    "power": 35
  },
  {
    "level": 6,
    "requiredLevel": 30,
    "spCost": 5300,
    "mpCost": 27,
    "power": 38
  },
  {
    "level": 7,
    "requiredLevel": 35,
    "spCost": 8800,
    "mpCost": 29,
    "power": 42
  },
  {
    "level": 8,
    "requiredLevel": 35,
    "spCost": 8800,
    "mpCost": 30,
    "power": 44
  }
]
};
