import { SkillDefinition } from "../../../types";

export const skill_1126: SkillDefinition = {
  id: 1126,
  code: "HM_1126",
  name: "Servitor Recharge",
  description: "Restores MP to the summon. The amount depends on level and level difference.\n\nВосстанавливает MP саммону. Величина зависит от уровня и разницы уровней. Восстанавливает 41-60 MP (зависит от уровня). Каст: 4 сек. Перезарядка: 12 сек.",
  icon: "/skills/skill1126.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  levels: [
  {
    "level": 1,
    "requiredLevel": 25,
    "spCost": 2800,
    "mpCost": 42,
    "power": 41
  },
  {
    "level": 2,
    "requiredLevel": 25,
    "spCost": 2800,
    "mpCost": 44,
    "power": 44
  },
  {
    "level": 3,
    "requiredLevel": 30,
    "spCost": 5300,
    "mpCost": 49,
    "power": 49
  },
  {
    "level": 4,
    "requiredLevel": 30,
    "spCost": 5300,
    "mpCost": 53,
    "power": 52
  },
  {
    "level": 5,
    "requiredLevel": 35,
    "spCost": 8800,
    "mpCost": 57,
    "power": 57
  },
  {
    "level": 6,
    "requiredLevel": 35,
    "spCost": 8800,
    "mpCost": 60,
    "power": 60
  }
]
};

