import { SkillDefinition } from "../../../types";

export const skill_1167: SkillDefinition = {
  id: 1167,
  code: "HM_1167",
  name: "Poisonous Cloud",
  description: "Instantaneous poison cloud attack. Effect 3.\n\nМгновенная атака ядовитым облаком. Эффект 3. Наносит эффект яда на 30 сек. с базовым шансом 35% (прохождение зависит от MEN цели), кастуется только на врагов, действует на врагов в радиусе 200 вокруг выбранной цели в пределах дальности 500: отнимает у цели по 90 HP раз в 5 сек. Каст: 4 сек. Перезарядка: 20 сек.",
  icon: "/skills/skill1167.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  levels: [
  {
    "level": 1,
    "requiredLevel": 25,
    "spCost": 5500,
    "mpCost": 34,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 35,
    "spCost": 18000,
    "mpCost": 45,
    "power": 0
  }
]
};
