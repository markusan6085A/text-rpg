import { SkillDefinition } from "../../../types";

// Iron Will для Paladin (рівні 1-3)
export const skill_0072: SkillDefinition = {
  id: 72,
  code: "PAL_0072",
  name: "Iron Will",
  description: "Temporarily increases M. Def.\n\nВременно увеличивает маг. защиту на 15-30% (зависит от уровня). Длительность: 20 сек. Каст: 4 сек. Перезарядка: 6 сек.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 20,
  icon: "/skills/skill0072.gif",
  effects: [
    { stat: "mDef", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 41000, mpCost: 38, power: 15 },
    { level: 2, requiredLevel: 49, spCost: 82000, mpCost: 44, power: 23 },
    { level: 3, requiredLevel: 55, spCost: 150000, mpCost: 50, power: 30 },
  ],
};

