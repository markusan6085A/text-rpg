import { SkillDefinition } from "../../../types";

// Detect Plant Weakness   .   .
export const Skill_0104: SkillDefinition = {
  id: 104,
  code: "GL_0104",
  name: "Detect Plant Weakness",
  description: "Temporarily increases P. Atk. against plants.\n\nВременно увеличивает физ. атаку против растений на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 600,
  cooldown: 2,
  icon: "/skills/0104.jpg",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 43000, mpCost: 21, power: 30 },
  ],
};

