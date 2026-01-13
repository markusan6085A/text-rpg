import { SkillDefinition } from "../../../types";

export const skill_0087: SkillDefinition = {
  id: 87,
  code: "WL_0087",
  name: "Detect Animal Weakness",
  description: "Temporarily increases P. Atk. against animals.\n\nВременно увеличивает физ. атаку против животных на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 600,
  icon: "/skills/skill0087.gif",
  levels: [
    { level: 1, requiredLevel: 40, spCost: 39000, mpCost: 18, power: 1.2 },
  ],
};

