import { SkillDefinition } from "../../../types";

// Detect Animal Weakness   .   .
export const Skill_0087: SkillDefinition = {
  id: 87,
  code: "GL_0087",
  name: "Detect Animal Weakness",
  description: "Temporarily increases P. Atk. against animals.\n\nВременно увеличивает физ. атаку против животных на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 600,
  cooldown: 2,
  icon: "/skills/0087.jpg",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 30000, mpCost: 18, power: 30 },
  ],
};

