import { SkillDefinition } from "../../../types";

// Surrender To Earth - continues from Elven Wizard level 1
export const skill_1231: SkillDefinition = {
  id: 1231,
  code: "ES_1231",
  name: "Surrender To Earth",
  description: "Instantly decreases enemy's resistance to earth attacks. Effect 3.\n\nМгновенно уменьшает сопротивление врага к атакам землей на 30% на 15 сек.",
  icon: "/skills/skill1223.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [
    { stat: "earthResist", mode: "percent", value: -30, resistStat: "wit" },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 0 },
    { level: 3, requiredLevel: 44, spCost: 37000, mpCost: 39, power: 0 },
    { level: 4, requiredLevel: 48, spCost: 60000, mpCost: 44, power: 0 },
    { level: 5, requiredLevel: 52, spCost: 95000, mpCost: 48, power: 0 },
    { level: 6, requiredLevel: 56, spCost: 95000, mpCost: 52, power: 0 },
    { level: 7, requiredLevel: 58, spCost: 120000, mpCost: 54, power: 0 },
    { level: 8, requiredLevel: 60, spCost: 150000, mpCost: 55, power: 0 },
    { level: 9, requiredLevel: 62, spCost: 180000, mpCost: 57, power: 0 },
    { level: 10, requiredLevel: 64, spCost: 240000, mpCost: 59, power: 0 },
    { level: 11, requiredLevel: 66, spCost: 350000, mpCost: 62, power: 0 },
    { level: 12, requiredLevel: 72, spCost: 790000, mpCost: 67, power: 0 },
  ],
};
