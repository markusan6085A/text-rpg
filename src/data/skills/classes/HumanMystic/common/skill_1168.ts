import { SkillDefinition } from "../../../types";

export const skill_1168: SkillDefinition = {
  id: 1168,
  code: "HM_1168",
  name: "Curse: Poison",
  description: "Instantaneous poisonous curse. Effect 3.\n\nМгновенное ядовитое проклятие. Наносит урон от яда: 24-144 (зависит от уровня) каждые 3 сек в течение 30 сек. Снижает регенерацию HP на 15% на 2 мин. Каст: 4 сек. Перезарядка: 12 сек.",
  icon: "/skills/Skill1168_0_panel_2.jpg",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 120,
  castTime: 4,
  cooldown: 12,
  effects: [{ stat: "hpRegen", mode: "percent", value: -15 }],
  levels: [{ level: 1, requiredLevel: 7, spCost: 470, mpCost: 10, power: 0 }],
};


