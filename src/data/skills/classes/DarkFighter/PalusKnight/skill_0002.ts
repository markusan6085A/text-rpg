import { SkillDefinition } from "../../../types";

// Confusion - throws enemy into confusion and gets them to change target
export const skill_0002: SkillDefinition = {
  id: 2,
  code: "PK_0002",
  name: "Confusion",
  description: "Throws the enemy into confusion and gets them to change the target of their attack.\n\nВводит врага в замешательство и заставляет его изменить цель атаки.",
  icon: "/skills/skill0002.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  duration: 5, // Effect duration
  chance: 80, // Success rate
  levels: [
    { level: 1, requiredLevel: 24, spCost: 8800, mpCost: 22, power: 0 },
    { level: 2, requiredLevel: 28, spCost: 13000, mpCost: 25, power: 0 },
    { level: 3, requiredLevel: 32, spCost: 22000, mpCost: 28, power: 0 },
    { level: 4, requiredLevel: 36, spCost: 28000, mpCost: 32, power: 0 },
  ],
};

