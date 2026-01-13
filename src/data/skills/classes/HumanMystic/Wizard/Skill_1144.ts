import { SkillDefinition } from "../../../types";

export const skill_1144: SkillDefinition = {
  id: 1144,
  code: "HM_1144",
  name: "Servitor Wind Walk",
  description: "Increases the summon's movement speed.\n\nУвеличивает скорость передвижения саммона. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1144.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
  {
    "level": 1,
    "requiredLevel": 35,
    "spCost": 18000,
    "mpCost": 30,
    "power": 0
  }
]
};

