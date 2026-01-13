import { SkillDefinition } from "../../../types";

// Power Break - instantly reduces enemy's P. Atk (continuation from Palus Knight)
export const skill_0115: SkillDefinition = {
  id: 115,
  code: "BD_0115",
  name: "Power Break",
  description: "Instantly reduces enemy's P. Atk. Effect 3.\n\nМгновенно снижает физическую атаку врага. Эффект 3.",
  icon: "/skills/skill0115.gif",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "single",
  castTime: 1.2,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 0.77 },
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 43000, mpCost: 18, power: 0 },
    { level: 4, requiredLevel: 43, spCost: 46000, mpCost: 19, power: 0 },
    { level: 5, requiredLevel: 46, spCost: 66000, mpCost: 22, power: 0 },
    { level: 6, requiredLevel: 49, spCost: 89000, mpCost: 23, power: 0 },
    { level: 7, requiredLevel: 52, spCost: 170000, mpCost: 24, power: 0 },
    { level: 8, requiredLevel: 55, spCost: 200000, mpCost: 25, power: 0 },
    { level: 9, requiredLevel: 58, spCost: 240000, mpCost: 28, power: 0 },
    { level: 10, requiredLevel: 60, spCost: 320000, mpCost: 28, power: 0 },
    { level: 11, requiredLevel: 62, spCost: 440000, mpCost: 29, power: 0 },
    { level: 12, requiredLevel: 64, spCost: 530000, mpCost: 30, power: 0 },
    { level: 13, requiredLevel: 66, spCost: 700000, mpCost: 32, power: 0 },
    { level: 14, requiredLevel: 68, spCost: 970000, mpCost: 33, power: 0 },
    { level: 15, requiredLevel: 70, spCost: 1000000, mpCost: 33, power: 0 },
    { level: 16, requiredLevel: 72, spCost: 1500000, mpCost: 34, power: 0 },
    { level: 17, requiredLevel: 74, spCost: 2300000, mpCost: 35, power: 0 },
  ],
};

