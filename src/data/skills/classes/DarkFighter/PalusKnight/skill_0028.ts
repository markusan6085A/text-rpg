import { SkillDefinition } from "../../../types";

// Aggression/Hate - provokes opponent to attack
export const skill_0028: SkillDefinition = {
  id: 28,
  code: "PK_0028",
  name: "Aggression",
  description: "Provokes an opponent to attack.\n\nПровоцирует противника на атаку.",
  icon: "/skills/skill0028.gif",
  category: "special",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 3,
  duration: 3,
  levels: [
    { level: 1, requiredLevel: 24, spCost: 2900, mpCost: 20, power: 655 },
    { level: 4, requiredLevel: 28, spCost: 4400, mpCost: 23, power: 752 },
    { level: 5, requiredLevel: 28, spCost: 4400, mpCost: 24, power: 777 },
    { level: 6, requiredLevel: 28, spCost: 4400, mpCost: 25, power: 803 },
    { level: 7, requiredLevel: 32, spCost: 7400, mpCost: 26, power: 855 },
    { level: 8, requiredLevel: 32, spCost: 7400, mpCost: 27, power: 882 },
    { level: 9, requiredLevel: 32, spCost: 7400, mpCost: 28, power: 909 },
    { level: 10, requiredLevel: 36, spCost: 9000, mpCost: 29, power: 965 },
    { level: 11, requiredLevel: 36, spCost: 9000, mpCost: 30, power: 993 },
    { level: 12, requiredLevel: 36, spCost: 9000, mpCost: 31, power: 1021 },
  ],
};

