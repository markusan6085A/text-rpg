import { SkillDefinition } from "../../../types";

export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "HM_1040",
  name: "Shield",
  description: "Temporarily increases P. Def. Effect 3.\n\nВременно увеличивает физ. защиту на 8-15% (зависит от уровня) на 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/Skill1040_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pDef", mode: "percent", value: 8 }],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 10, power: 8 },
    { level: 2, requiredLevel: 14, spCost: 2100, mpCost: 18, power: 12 },
    { level: 3, requiredLevel: 20, spCost: 6900, mpCost: 31, power: 15 },
  ],
};


