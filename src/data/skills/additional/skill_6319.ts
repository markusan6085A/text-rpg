import { SkillDefinition } from "../types";

// Sacred Seal - пасивний скіл, що зменшує перезарядку всіх скілів та збільшує максимальний HP
export const skill_6319: SkillDefinition = {
  id: 6319,
  code: "ADD_6319",
  name: "Sacred Seal",
  description: "A sacred seal that enhances skill mastery and vitality. Permanently reduces cooldown of all skills and increases maximum HP.\n\nСвященная печать, усиливающая мастерство навыков и жизненную силу.\n\nЭффекты:\n• Сокращение КД всех умений: -20%\n• Максимальный HP: +5%",
  icon: "/dopskills/skill6319.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "cooldownReduction", mode: "percent", value: 20 }, // +20% cooldown reduction (зменшує КД на 20%)
    { stat: "maxHp", mode: "percent", value: 5 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 100, mpCost: 0, power: 0 }, // spCost використовується як вартість аден (100 аден)
  ],
};

