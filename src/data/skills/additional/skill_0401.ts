import { SkillDefinition } from "../types";

// Rage of Battle - пасивний скіл, що збільшує шанс критичної атаки (фізичної та магічної) та максимальний MP
export const skill_0401: SkillDefinition = {
  id: 401,
  code: "ADD_0401",
  name: "Rage of Battle",
  description: "A fierce battle spirit that enhances critical strike capabilities and magical power. Permanently increases physical and magical critical rate, and maximum MP.\n\nЯростный боевой дух, усиливающий способности к критическим ударам и магическую силу. Постоянно увеличивает шанс критической атаки (физической и магической) и максимальный MP.\n\nЭффекты:\n• Физ. крит: +15%\n• Маг. крит: +15%\n• Максимальный MP: +10%",
  icon: "/dopskills/skill0401.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "critRate", mode: "percent", value: 15 },
    { stat: "skillCritRate", mode: "percent", value: 15 },
    { stat: "maxMp", mode: "percent", value: 10 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

