import { SkillDefinition } from "../../../types";

// Confusion - throws enemy into confusion and gets them to change target (continuation from Palus Knight)
export const skill_0002: SkillDefinition = {
  id: 2,
  code: "BD_0002",
  name: "Confusion",
  description: "Throws the enemy into confusion and gets them to change the target of their attack.\n\nВводит врага в замешательство и заставляет его изменить цель атаки.",
  icon: "/skills/skill0002.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  duration: 5,
  chance: 80,
  levels: [
    { level: 5, requiredLevel: 40, spCost: 43000, mpCost: 35, power: 0 },
    { level: 6, requiredLevel: 43, spCost: 46000, mpCost: 38, power: 0 },
    { level: 7, requiredLevel: 46, spCost: 66000, mpCost: 42, power: 0 },
    { level: 8, requiredLevel: 49, spCost: 89000, mpCost: 44, power: 0 },
    { level: 9, requiredLevel: 52, spCost: 170000, mpCost: 48, power: 0 },
    { level: 10, requiredLevel: 55, spCost: 200000, mpCost: 50, power: 0 },
    { level: 11, requiredLevel: 58, spCost: 240000, mpCost: 54, power: 0 },
    { level: 12, requiredLevel: 60, spCost: 320000, mpCost: 55, power: 0 },
    { level: 13, requiredLevel: 62, spCost: 440000, mpCost: 58, power: 0 },
    { level: 14, requiredLevel: 64, spCost: 530000, mpCost: 60, power: 0 },
    { level: 15, requiredLevel: 66, spCost: 700000, mpCost: 62, power: 0 },
    { level: 16, requiredLevel: 68, spCost: 970000, mpCost: 64, power: 0 },
    { level: 17, requiredLevel: 70, spCost: 1000000, mpCost: 65, power: 0 },
    { level: 18, requiredLevel: 72, spCost: 1500000, mpCost: 67, power: 0 },
    { level: 19, requiredLevel: 74, spCost: 2300000, mpCost: 69, power: 0 },
  ],
};

