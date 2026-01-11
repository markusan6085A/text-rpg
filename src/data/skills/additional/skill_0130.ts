import { SkillDefinition } from "../types";

// Stone of Time - пасивний скіл, що збільшує швидкість атаки, швидкість каста та максимальний HP
export const skill_0130: SkillDefinition = {
  id: 130,
  code: "ADD_0130",
  name: "Stone of Time",
  description: "A mystical stone that enhances combat capabilities. Permanently increases attack speed, casting speed, and maximum HP.\n\nМистический камень, усиливающий боевые способности.\n\nЭффекты:\n• Скорость атаки: +15%\n• Скорость каста: +15%\n• Максимальный HP: +7%",
  icon: "/dopskills/skill0130.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackSpeed", mode: "percent", value: 15 },
    { stat: "castSpeed", mode: "percent", value: 15 },
    { stat: "maxHp", mode: "percent", value: 7 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

