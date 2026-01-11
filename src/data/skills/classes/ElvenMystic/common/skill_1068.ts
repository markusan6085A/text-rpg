import { SkillDefinition } from "../../../types";

// Might - temporarily increases P. Atk.
export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "EM_1068",
  name: "Might",
  description: "Temporarily increases P. Atk. Effect 1.\n\nВременно увеличивает физическую атаку на 8% на 20 сек. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/Skill1068_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "pAtk", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 10, power: 8 },
  ],
};

