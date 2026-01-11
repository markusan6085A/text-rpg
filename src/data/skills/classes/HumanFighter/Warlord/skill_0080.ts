import { SkillDefinition } from "../../../types";

export const skill_0080: SkillDefinition = {
  id: 80,
  code: "WL_0080",
  name: "Detect Monster Weakness",
  description: "Temporarily increases P. Atk. against monsters.\n\nВременно увеличивает физ. атаку против монстров на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 600,
  icon: "/skills/skill0080.gif",
  levels: [
    { level: 1, requiredLevel: 52, spCost: 150000, mpCost: 24, power: 1.2 },
  ],
};

