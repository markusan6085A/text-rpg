import { SkillDefinition } from "../../../types";

// Fatal Counter - shoots an arrow containing pain of user, more powerful at lower HP
export const skill_0314: SkillDefinition = {
  id: 314,
  code: "PR_0314",
  name: "Fatal Counter",
  description: "Shoots an arrow containing pain of user. More powerful effect at lower HP level. Usable when a bow is equipped.\n\nВыпускает стрелу, содержащую боль пользователя. Более мощный эффект при низком уровне HP. Требуется лук.",
  icon: "/skills/skill0314.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 60, spCost: 120000, mpCost: 129, power: 2908 },
    { level: 2, requiredLevel: 60, spCost: 120000, mpCost: 132, power: 3030 },
    { level: 3, requiredLevel: 62, spCost: 150000, mpCost: 135, power: 3154 },
    { level: 4, requiredLevel: 62, spCost: 150000, mpCost: 135, power: 3280 },
    { level: 5, requiredLevel: 64, spCost: 180000, mpCost: 138, power: 3408 },
    { level: 6, requiredLevel: 64, spCost: 180000, mpCost: 140, power: 3537 },
    { level: 7, requiredLevel: 66, spCost: 250000, mpCost: 143, power: 3668 },
    { level: 8, requiredLevel: 66, spCost: 250000, mpCost: 145, power: 3800 },
    { level: 9, requiredLevel: 68, spCost: 300000, mpCost: 148, power: 3933 },
    { level: 10, requiredLevel: 68, spCost: 300000, mpCost: 150, power: 4067 },
    { level: 11, requiredLevel: 70, spCost: 360000, mpCost: 153, power: 4201 },
    { level: 12, requiredLevel: 70, spCost: 360000, mpCost: 155, power: 4336 },
    { level: 13, requiredLevel: 72, spCost: 580000, mpCost: 157, power: 4470 },
    { level: 14, requiredLevel: 72, spCost: 580000, mpCost: 160, power: 4604 },
    { level: 15, requiredLevel: 74, spCost: 820000, mpCost: 162, power: 4738 },
    { level: 16, requiredLevel: 74, spCost: 820000, mpCost: 164, power: 4870 },
  ],
};

