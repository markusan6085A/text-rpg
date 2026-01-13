import { SkillDefinition } from "../../../types";

// Curse: Weakness - continues from Elven Wizard level 5
export const skill_1164: SkillDefinition = {
  id: 1164,
  code: "ES_1164",
  name: "Curse: Weakness",
  description: "Instantaneous curse that reduces target's P. Atk. Effect 3.\n\nМгновенное проклятие, уменьшающее физическую атаку цели на 23%.",
  icon: "/skills/skill1164.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [
    { stat: "pAtk", mode: "percent", value: -23, resistStat: "wit" },
  ],
  levels: [
    { level: 6, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 0 },
    { level: 7, requiredLevel: 44, spCost: 37000, mpCost: 39, power: 0 },
    { level: 8, requiredLevel: 48, spCost: 60000, mpCost: 44, power: 0 },
    { level: 9, requiredLevel: 52, spCost: 95000, mpCost: 48, power: 0 },
    { level: 10, requiredLevel: 56, spCost: 95000, mpCost: 52, power: 0 },
    { level: 11, requiredLevel: 58, spCost: 120000, mpCost: 54, power: 0 },
    { level: 12, requiredLevel: 60, spCost: 150000, mpCost: 55, power: 0 },
    { level: 13, requiredLevel: 62, spCost: 210000, mpCost: 58, power: 0 },
    { level: 14, requiredLevel: 64, spCost: 250000, mpCost: 60, power: 0 },
    { level: 15, requiredLevel: 66, spCost: 350000, mpCost: 62, power: 0 },
    { level: 16, requiredLevel: 68, spCost: 390000, mpCost: 64, power: 0 },
    { level: 17, requiredLevel: 70, spCost: 470000, mpCost: 65, power: 0 },
    { level: 18, requiredLevel: 72, spCost: 790000, mpCost: 67, power: 0 },
    { level: 19, requiredLevel: 74, spCost: 1100000, mpCost: 69, power: 0 },
  ],
};

