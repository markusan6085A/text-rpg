import { SkillDefinition } from "../../../types";

// Switch - throws enemy into confusion and causes them to change target
export const skill_0012: SkillDefinition = {
  id: 12,
  code: "PW_0012",
  name: "Switch",
  description: "Throws the enemy into confusion and thereby causes them to change the target of their attack.\n\nВводит врага в замешательство и заставляет его изменить цель атаки. Шанс 80%.",
  icon: "/skills/skill0012.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.2,
  cooldown: 12,
  chance: 80,
  levels: [
    { level: 1, requiredLevel: 43, spCost: 35000, mpCost: 45, power: 80 },
    { level: 2, requiredLevel: 46, spCost: 43000, mpCost: 49, power: 80 },
    { level: 3, requiredLevel: 49, spCost: 75000, mpCost: 54, power: 80 },
    { level: 4, requiredLevel: 52, spCost: 120000, mpCost: 56, power: 80 },
    { level: 5, requiredLevel: 55, spCost: 160000, mpCost: 61, power: 80 },
    { level: 6, requiredLevel: 58, spCost: 200000, mpCost: 65, power: 80 },
    { level: 7, requiredLevel: 60, spCost: 260000, mpCost: 68, power: 80 },
    { level: 8, requiredLevel: 62, spCost: 370000, mpCost: 69, power: 80 },
    { level: 9, requiredLevel: 64, spCost: 480000, mpCost: 72, power: 80 },
    { level: 10, requiredLevel: 66, spCost: 640000, mpCost: 74, power: 80 },
    { level: 11, requiredLevel: 68, spCost: 650000, mpCost: 77, power: 80 },
    { level: 12, requiredLevel: 70, spCost: 850000, mpCost: 79, power: 80 },
    { level: 13, requiredLevel: 72, spCost: 1400000, mpCost: 81, power: 80 },
    { level: 14, requiredLevel: 74, spCost: 2100000, mpCost: 83, power: 80 },
  ],
};

