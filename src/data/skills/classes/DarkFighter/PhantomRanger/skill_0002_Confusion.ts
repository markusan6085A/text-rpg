import { SkillDefinition } from "../../../types";

// Confusion - throws enemy into confusion (continuation from Assassin lv.5-19)
export const skill_0002_Confusion: SkillDefinition = {
  id: 2,
  code: "PR_0002",
  name: "Confusion",
  description: "Throws the enemy into confusion and gets them to change the target of their attack.\n\nВводит врага в замешательство и заставляет изменить цель атаки.",
  icon: "/skills/skill0002.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  duration: 600, // 10 minutes
  chance: 80, // Success rate
  effects: [
    { stat: "mentalResist", mode: "multiplier", multiplier: 0 }, // Confusion effect
  ],
  levels: [
    { level: 5, requiredLevel: 40, spCost: 33000, mpCost: 35, power: 80 },
    { level: 6, requiredLevel: 43, spCost: 33000, mpCost: 38, power: 80 },
    { level: 7, requiredLevel: 46, spCost: 47000, mpCost: 42, power: 80 },
    { level: 8, requiredLevel: 49, spCost: 75000, mpCost: 44, power: 80 },
    { level: 9, requiredLevel: 52, spCost: 120000, mpCost: 48, power: 80 },
    { level: 10, requiredLevel: 55, spCost: 170000, mpCost: 50, power: 80 },
    { level: 11, requiredLevel: 58, spCost: 180000, mpCost: 54, power: 80 },
    { level: 12, requiredLevel: 60, spCost: 240000, mpCost: 55, power: 80 },
    { level: 13, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 80 },
    { level: 14, requiredLevel: 64, spCost: 370000, mpCost: 60, power: 80 },
    { level: 15, requiredLevel: 66, spCost: 500000, mpCost: 62, power: 80 },
    { level: 16, requiredLevel: 68, spCost: 600000, mpCost: 64, power: 80 },
    { level: 17, requiredLevel: 70, spCost: 720000, mpCost: 65, power: 80 },
    { level: 18, requiredLevel: 72, spCost: 1200000, mpCost: 67, power: 80 },
    { level: 19, requiredLevel: 74, spCost: 1600000, mpCost: 69, power: 80 },
  ],
};

