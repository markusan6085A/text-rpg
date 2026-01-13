import { SkillDefinition } from "../types";

// Crystal of Ice - пасивний скіл, що збільшує силу крита, максимальний HP та магічну захист
export const skill_0279: SkillDefinition = {
  id: 279,
  code: "ADD_0279",
  name: "Crystal of Ice",
  description: "A mystical crystal that enhances critical strike power and magical protection. Permanently increases critical power, maximum HP, and magical defense.\n\nМистический кристалл, усиливающий силу критических ударов и магическую защиту.\n\nЭффекты:\n• Сила крита: +150\n• Максимальный HP: +7%\n• Маг. защита: +15%",
  icon: "/dopskills/skill0279.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "critDamage", mode: "flat", value: 150 },
    { stat: "maxHp", mode: "percent", value: 7 },
    { stat: "mDef", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

