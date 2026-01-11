import { SkillDefinition } from "../../../types";

export const skill_0359: SkillDefinition = {
  id: 359,
  code: "DN_0359",
  name: "Eye of Hunter",
  description: "Temporarily increases P. Atk against insects/plants/animals.\n\nВременно увеличивает физ. атаку против насекомых/растений/животных на 40% на 10 мин. Каст: 2 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0359.gif",
  castTime: 2,
  cooldown: 10,
  duration: 600,
  levels: [
    { level: 1, requiredLevel: 77, spCost: 15000000, mpCost: 70, power: 0 },
  ],
};

