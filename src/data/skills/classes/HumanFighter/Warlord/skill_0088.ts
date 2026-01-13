import { SkillDefinition } from "../../../types";

export const skill_0088: SkillDefinition = {
  id: 88,
  code: "WL_0088",
  name: "Detect Dragon Weakness",
  description: "Temporarily increases P. Atk. against dragons.\n\nВременно увеличивает физ. атаку против драконов на 30% на 10 мин. Каст: 1.5 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 600,
  icon: "/skills/skill0088.gif",
  levels: [
    { level: 1, requiredLevel: 58, spCost: 210000, mpCost: 27, power: 1.2 },
  ],
};

