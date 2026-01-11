import { SkillDefinition } from "../types";

// Dark Resonance - пасивний скіл, що збільшує фізичну та магічну захист, а також максимальний MP
export const skill_0481: SkillDefinition = {
  id: 481,
  code: "ADD_0481",
  name: "Dark Resonance",
  description: "A mystical resonance that enhances defensive capabilities and magical power. Permanently increases physical defense, magical defense, and maximum MP.\n\nМистический резонанс, усиливающий защитные способности и магическую силу.\n\nЭффекты:\n• Физ. защита: +250\n• Маг. защита: +250\n• Максимальный MP: +500",
  icon: "/dopskills/skill0481.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat", value: 250 },
    { stat: "mDef", mode: "flat", value: 250 },
    { stat: "maxMp", mode: "flat", value: 500 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

