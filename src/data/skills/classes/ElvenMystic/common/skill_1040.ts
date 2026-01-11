import { SkillDefinition } from "../../../types";

// Shield - temporarily increases P. Def.
export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "EM_1040",
  name: "Shield",
  description: "Temporarily increases P. Def. Effect 1.\n\nВременно увеличивает физическую защиту на 8% на 20 сек. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/Skill1040_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "pDef", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 10, power: 8 },
  ],
};

