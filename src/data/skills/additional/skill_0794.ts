import { SkillDefinition } from "../types";

// Totem of Stone - пасивний скіл, що збільшує максимальний HP, уклонение та CP
// CP буде додано при вивченні скіла (через AdditionalSkillsScreen)
export const skill_0794: SkillDefinition = {
  id: 794,
  code: "ADD_0794",
  name: "Totem of Stone",
  description: "A mystical totem that enhances vitality, evasion, and combat power. Permanently increases maximum HP, evasion, and maximum CP.\n\nМистический тотем, усиливающий жизненную силу, уклонение и боевую мощь.\n\nЭффекты:\n• Максимальный HP: +500\n• Уклонение: +15\n• Максимальный CP: +1000",
  icon: "/dopskills/skill0794.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxHp", mode: "flat", value: 500 },
    { stat: "evasion", mode: "flat", value: 15 },
    { stat: "maxCp", mode: "flat", value: 1000 }, // CP додається як пасивний ефект
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

