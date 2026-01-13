import { SkillDefinition } from "../../../types";

export const skill_0317: SkillDefinition = {
  id: 317,
  code: "WL_0317",
  name: "Focus Attack",
  description: "Attacks one enemy at a time. Used with a spear. Increases critical damage.\n\nАтакует одного врага за раз. При использовании копья временно увеличивает точность на 2-6 и силу критической атаки на 10-30% (зависит от уровня) на 120 сек. Требуется копье. Каст: 2 сек. Перезарядка: 4.5 мин.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 12,
  duration: 120,
  icon: "/skills/skill0317.gif",
  effects: [{ stat: "critDamage", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 39000, mpCost: 7, power: 10 },
    { level: 2, requiredLevel: 43, spCost: 46000, mpCost: 7, power: 15 },
    { level: 3, requiredLevel: 46, spCost: 55000, mpCost: 7, power: 20 },
    { level: 4, requiredLevel: 49, spCost: 89000, mpCost: 7, power: 25 },
    { level: 5, requiredLevel: 52, spCost: 150000, mpCost: 7, power: 30 },
  ],
};

