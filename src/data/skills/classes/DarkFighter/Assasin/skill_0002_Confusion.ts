import { SkillDefinition } from "../../../types";

// Confusion - throws enemy into confusion
export const skill_0002_Confusion: SkillDefinition = {
  id: 2,
  code: "AS_0002",
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
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 22, power: 80 }, // 80% chance
    { level: 2, requiredLevel: 28, spCost: 8500, mpCost: 25, power: 80 }, // 80% chance
    { level: 3, requiredLevel: 32, spCost: 14000, mpCost: 28, power: 80 }, // 80% chance
    { level: 4, requiredLevel: 36, spCost: 22000, mpCost: 32, power: 80 }, // 80% chance
  ],
};

