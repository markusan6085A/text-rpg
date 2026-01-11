import { SkillDefinition } from "../types";

// Fist of Power - пасивний скіл, що збільшує швидкість атаки та швидкість каста
export const skill_0820: SkillDefinition = {
  id: 820,
  code: "ADD_0820",
  name: "Fist of Power",
  description: "A powerful fist that enhances combat speed. Permanently increases attack speed and casting speed.\n\nМощный кулак, усиливающий боевую скорость.\n\nЭффекты:\n• Скорость атаки: +150\n• Скорость каста: +150",
  icon: "/dopskills/skill0820.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackSpeed", mode: "flat", value: 150 },
    { stat: "castSpeed", mode: "flat", value: 150 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

