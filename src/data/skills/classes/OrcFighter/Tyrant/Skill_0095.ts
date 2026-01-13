import { SkillDefinition } from "../../../types";

export const Skill_0095: SkillDefinition = {
  id: 95,
  code: "TY_0095",
  name: "Cripple",
  description: "Temporarily reduces target's speed. Used with hand-to-hand combat equipment.\n\nВременно уменьшает скорость цели. Используется с оружием для рукопашного боя.",
  icon: "/skills/skill0095.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.604,
  cooldown: 7,
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.5, chance: 80, duration: 2 },
  ],
  levels: [
    { level: 6, requiredLevel: 40, spCost: 39000, mpCost: 35, power: 0 },
    { level: 7, requiredLevel: 43, spCost: 51000, mpCost: 38, power: 0 },
    { level: 8, requiredLevel: 46, spCost: 60000, mpCost: 41, power: 0 },
    { level: 9, requiredLevel: 49, spCost: 110000, mpCost: 44, power: 0 },
    { level: 10, requiredLevel: 52, spCost: 150000, mpCost: 47, power: 0 },
    { level: 11, requiredLevel: 55, spCost: 220000, mpCost: 50, power: 0 },
    { level: 12, requiredLevel: 58, spCost: 240000, mpCost: 53, power: 0 },
    { level: 13, requiredLevel: 61, spCost: 290000, mpCost: 55, power: 0 },
    { level: 14, requiredLevel: 64, spCost: 400000, mpCost: 58, power: 0 },
    { level: 15, requiredLevel: 67, spCost: 480000, mpCost: 59, power: 0 },
    { level: 16, requiredLevel: 70, spCost: 700000, mpCost: 61, power: 0 },
    { level: 17, requiredLevel: 72, spCost: 780000, mpCost: 63, power: 0 },
    { level: 18, requiredLevel: 72, spCost: 1000000, mpCost: 65, power: 0 },
    { level: 19, requiredLevel: 74, spCost: 1400000, mpCost: 67, power: 0 },
    { level: 20, requiredLevel: 74, spCost: 2600000, mpCost: 68, power: 0 },
  ],
};

