import { SkillDefinition } from "../../../types";

export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "HM_1068",
  name: "Might",
  description: "Temporarily increases P. Atk. Effect 3.\n\nВременно увеличивает физ. атаку на 8-15% (зависит от уровня) на 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/Skill1068_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pAtk", mode: "percent", value: 8 }],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 10, power: 8 },
    { level: 2, requiredLevel: 14, spCost: 2100, mpCost: 16, power: 12 },
    { level: 3, requiredLevel: 20, spCost: 6900, mpCost: 28, power: 15 },
  ],
};


