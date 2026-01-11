import { SkillDefinition } from "../../../types";

// Resist Aqua - continues from Elven Wizard level 1
export const skill_1189: SkillDefinition = {
  id: 1189,
  code: "ES_1189",
  name: "Resist Aqua",
  description: "Temporarily increases tolerance to attack by water. Effect 2-3.\n\nВременно увеличивает сопротивление к атакам водой на 23-30% на 20 сек.",
  icon: "/skills/skill1189.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "waterResist", mode: "percent" },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 23 },
    { level: 3, requiredLevel: 44, spCost: 37000, mpCost: 39, power: 30 },
  ],
};

