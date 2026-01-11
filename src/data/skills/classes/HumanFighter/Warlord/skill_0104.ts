import { SkillDefinition } from "../../../types";

export const skill_0104: SkillDefinition = {
  id: 104,
  code: "WL_0104",
  name: "Detect Plant Weakness",
  description: "Temporarily increases P. Atk. against plants.\n\nВременно увеличивает физ. атаку против растений на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 600,
  icon: "/skills/skill0104.gif",
  levels: [
    { level: 1, requiredLevel: 46, spCost: 55000, mpCost: 21, power: 1.2 },
  ],
};

