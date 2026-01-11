import { SkillDefinition } from "../../../types";

// Detect Dragon Weakness   .   .
export const Skill_0088: SkillDefinition = {
  id: 88,
  code: "GL_0088",
  name: "Detect Dragon Weakness",
  description: "Temporarily increases P. Atk. against dragons.\n\nВременно увеличивает физ. атаку против драконов на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 600,
  cooldown: 2,
  icon: "/skills/0088.jpg",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 153000, mpCost: 27, power: 30 },
  ],
};

