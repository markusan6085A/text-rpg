import { SkillDefinition } from "../../../types";

// Mana Regeneration - temporarily increases ability to regenerate MP
export const skill_1047: SkillDefinition = {
  id: 1047,
  code: "ES_1047",
  name: "Mana Regeneration",
  description: "Temporarily increases ability to regenerate MP. Consumes 7-15 Spirit Ores. Effect 1-4.\n\nВременно увеличивает способность восстанавливать MP на 1.72-3.09 MP/сек на 20 сек.",
  icon: "/skills/skill1047.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 20,
  effects: [
    { stat: "mpRegen", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 1.72 },
    { level: 2, requiredLevel: 48, spCost: 60000, mpCost: 44, power: 2.16 },
    { level: 3, requiredLevel: 60, spCost: 150000, mpCost: 55, power: 2.74 },
    { level: 4, requiredLevel: 70, spCost: 470000, mpCost: 65, power: 3.09 },
  ],
};

