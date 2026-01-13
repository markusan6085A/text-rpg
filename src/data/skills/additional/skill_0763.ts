import { SkillDefinition } from "../types";

// Cry of Rage - пасивний скіл, що збільшує фізичну та магічну атаку, а також точність
export const skill_0763: SkillDefinition = {
  id: 763,
  code: "ADD_0763",
  name: "Cry of Rage",
  description: "A furious cry that enhances offensive capabilities and precision. Permanently increases physical attack, magical attack, and accuracy.\n\nЯростный крик, усиливающий боевые способности и точность.\n\nЭффекты:\n• Физ. атака: +250\n• Маг. атака: +250\n• Точность: +15%",
  icon: "/dopskills/skill0763.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat", value: 250 },
    { stat: "mAtk", mode: "flat", value: 250 },
    { stat: "accuracy", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

