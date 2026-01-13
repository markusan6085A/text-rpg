import { SkillDefinition } from "../../../types";

// Concentration
export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "HM_1078",
  name: "Concentration",
  description: "Temporarily lowers the probability of magic being canceled due to damage taken.\n\nВременно снижает вероятность прерывания магии при получении урона.",
  icon: "/skills/skill1078.gif",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [{ stat: "cancelResist", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 20, power: 18 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 27, power: 25 },
    { level: 3, requiredLevel: 40, spCost: 32000, mpCost: 31, power: 36 },
    { level: 4, requiredLevel: 48, spCost: 75000, mpCost: 38, power: 42 },
    { level: 5, requiredLevel: 56, spCost: 130000, mpCost: 44, power: 48 },
    { level: 6, requiredLevel: 62, spCost: 310000, mpCost: 51, power: 53 },
  ],
};
