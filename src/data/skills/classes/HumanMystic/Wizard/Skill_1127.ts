import { SkillDefinition } from "../../../types";

export const skill_1127: SkillDefinition = {
  id: 1127,
  code: "HM_1127",
  name: "Servitor Heal",
  description: "Restores HP to the summon.\n\nВосстанавливает HP саммону. Восстанавливает 145-361 HP (зависит от уровня). Каст: 4 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1127.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 960,
    "mpCost": 24,
    "power": 145
  },
  {
    "level": 2,
    "requiredLevel": 20,
    "spCost": 960,
    "mpCost": 27,
    "power": 162
  },
  {
    "level": 3,
    "requiredLevel": 20,
    "spCost": 960,
    "mpCost": 30,
    "power": 181
  },
  {
    "level": 4,
    "requiredLevel": 25,
    "spCost": 1800,
    "mpCost": 33,
    "power": 212
  },
  {
    "level": 5,
    "requiredLevel": 25,
    "spCost": 1800,
    "mpCost": 35,
    "power": 222
  },
  {
    "level": 6,
    "requiredLevel": 25,
    "spCost": 1800,
    "mpCost": 37,
    "power": 234
  },
  {
    "level": 7,
    "requiredLevel": 30,
    "spCost": 3500,
    "mpCost": 42,
    "power": 269
  },
  {
    "level": 8,
    "requiredLevel": 30,
    "spCost": 3500,
    "mpCost": 44,
    "power": 281
  },
  {
    "level": 9,
    "requiredLevel": 30,
    "spCost": 3500,
    "mpCost": 44,
    "power": 294
  },
  {
    "level": 10,
    "requiredLevel": 35,
    "spCost": 5900,
    "mpCost": 48,
    "power": 333
  },
  {
    "level": 11,
    "requiredLevel": 35,
    "spCost": 5900,
    "mpCost": 50,
    "power": 347
  },
  {
    "level": 12,
    "requiredLevel": 35,
    "spCost": 5900,
    "mpCost": 52,
    "power": 361
  }
]
};

