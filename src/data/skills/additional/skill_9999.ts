import { SkillDefinition } from "../types";

// Holy Protection - пасивний скіл, що збільшує фізичну та магічну атаку, захист, HP та CP
export const skill_9999: SkillDefinition = {
  id: 9999,
  code: "ADD_9999",
  name: "Holy Protection",
  description: "A holy protection that enhances all combat capabilities. Permanently increases physical and magical attack, defense, HP, and maximum CP.\n\nСвященная защита, усиливающая все боевые способности.\n\nЭффекты:\n• Физ. атака: +5%\n• Маг. атака: +5%\n• Физ. защита: +5%\n• Маг. защита: +5%\n• Максимальный HP: +5%\n• Максимальный CP: +10%",
  icon: "/dopskills/skillhuman.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent", value: 5 },
    { stat: "mAtk", mode: "percent", value: 5 },
    { stat: "pDef", mode: "percent", value: 5 },
    { stat: "mDef", mode: "percent", value: 5 },
    { stat: "maxHp", mode: "percent", value: 5 },
    { stat: "maxCp", mode: "percent", value: 10 }, // CP додається як пасивний ефект
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

