import { SkillDefinition } from "../../../types";

export const skill_1333: SkillDefinition = {
  id: 1333,
  code: "DMP_1333",
  name: "Summon Nightshade",
  description: "Summons a Nightshade, a servitor.\n\nПризыв Ночной Тени, слуги.",
  icon: "/skills/skill1333.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 40, power: 0, mpCost: 56, spCost: 32000 },
    { level: 2, requiredLevel: 44, power: 0, mpCost: 92, spCost: 55000 },
    { level: 3, requiredLevel: 48, power: 0, mpCost: 69, spCost: 110000 },
    { level: 4, requiredLevel: 52, power: 0, mpCost: 75, spCost: 210000 },
    { level: 5, requiredLevel: 56, power: 0, mpCost: 82, spCost: 400000 },
    { level: 6, requiredLevel: 60, power: 0, mpCost: 85, spCost: 640000 },
    { level: 7, requiredLevel: 64, power: 0, mpCost: 88, spCost: 1300000 },
    { level: 8, requiredLevel: 68, power: 0, mpCost: 92, spCost: 2000000 },
    { level: 9, requiredLevel: 72, power: 0, mpCost: 95, spCost: 3200000 },
    { level: 10, requiredLevel: 74, power: 0, mpCost: 98, spCost: 3900000 },
  ],
};

