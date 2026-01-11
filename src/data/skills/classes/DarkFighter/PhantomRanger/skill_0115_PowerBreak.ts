import { SkillDefinition } from "../../../types";

// Power Break - instantly reduces enemy's P. Atk (continuation from Assassin lv.3-17)
export const skill_0115_PowerBreak: SkillDefinition = {
  id: 115,
  code: "PR_0115",
  name: "Power Break",
  description: "Instantly reduces enemy's P. Atk Effect 3.\n\nМгновенно снижает физическую атаку врага на 23%.",
  icon: "/skills/skill0115.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.2,
  cooldown: 8,
  duration: 15,
  chance: 80, // Success rate depends on WIT stat
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 0.77 }, // Reduces by 23%
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 33000, mpCost: 18, power: 23 },
    { level: 4, requiredLevel: 43, spCost: 33000, mpCost: 19, power: 23 },
    { level: 5, requiredLevel: 46, spCost: 47000, mpCost: 22, power: 23 },
    { level: 6, requiredLevel: 49, spCost: 75000, mpCost: 23, power: 23 },
    { level: 7, requiredLevel: 52, spCost: 120000, mpCost: 24, power: 23 },
    { level: 8, requiredLevel: 55, spCost: 170000, mpCost: 25, power: 23 },
    { level: 9, requiredLevel: 58, spCost: 180000, mpCost: 28, power: 23 },
    { level: 10, requiredLevel: 60, spCost: 240000, mpCost: 28, power: 23 },
    { level: 11, requiredLevel: 62, spCost: 310000, mpCost: 29, power: 23 },
    { level: 12, requiredLevel: 64, spCost: 370000, mpCost: 30, power: 23 },
    { level: 13, requiredLevel: 66, spCost: 500000, mpCost: 32, power: 23 },
    { level: 14, requiredLevel: 68, spCost: 600000, mpCost: 33, power: 23 },
    { level: 15, requiredLevel: 70, spCost: 720000, mpCost: 33, power: 23 },
    { level: 16, requiredLevel: 72, spCost: 1200000, mpCost: 34, power: 23 },
    { level: 17, requiredLevel: 74, spCost: 1600000, mpCost: 35, power: 23 },
  ],
};

