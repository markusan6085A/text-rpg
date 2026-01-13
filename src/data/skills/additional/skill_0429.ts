import { SkillDefinition } from "../types";

// Stone Guardian - пасивний скіл, що збільшує фізичну та магічну захист, а також максимальний HP
export const skill_0429: SkillDefinition = {
  id: 429,
  code: "ADD_0429",
  name: "Stone Guardian",
  description: "A protective stone that enhances defensive capabilities. Permanently increases physical defense, magical defense, and maximum HP.\n\nЗащитный камень, усиливающий оборонительные способности.\n\nЭффекты:\n• Физ. защита: +10%\n• Маг. защита: +10%\n• Максимальный HP: +5%",
  icon: "/dopskills/skill0429.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "percent", value: 10 },
    { stat: "mDef", mode: "percent", value: 10 },
    { stat: "maxHp", mode: "percent", value: 5 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

