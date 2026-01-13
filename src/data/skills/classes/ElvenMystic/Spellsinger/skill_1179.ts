import { SkillDefinition } from "../../../types";

// Frost Bolt - freezing attack that reduces enemy's Speed
export const skill_1179: SkillDefinition = {
  id: 1179,
  code: "ES_1179",
  name: "Frost Bolt",
  description: "Freezing attack that reduces enemy's Speed. Effect 2. Power 30-57.\n\nАтака льдом, которая уменьшает скорость врага на 30%. Эффект 2. Сила 30-57.",
  icon: "/skills/skill1236.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "water",
  target: "enemy",
  scope: "single",
  castTime: 3.1,
  cooldown: 8,
  duration: 2,
  chance: 60,
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7, resistStat: "wit" }, // 30% speed reduction
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 14000, mpCost: 34, power: 30 },
    { level: 2, requiredLevel: 40, spCost: 14000, mpCost: 35, power: 31 },
    { level: 3, requiredLevel: 44, spCost: 18000, mpCost: 38, power: 33 },
    { level: 4, requiredLevel: 44, spCost: 18000, mpCost: 39, power: 35 },
    { level: 5, requiredLevel: 48, spCost: 30000, mpCost: 42, power: 37 },
    { level: 6, requiredLevel: 48, spCost: 30000, mpCost: 44, power: 39 },
    { level: 7, requiredLevel: 52, spCost: 47000, mpCost: 45, power: 41 },
    { level: 8, requiredLevel: 52, spCost: 47000, mpCost: 48, power: 43 },
    { level: 9, requiredLevel: 56, spCost: 48000, mpCost: 49, power: 45 },
    { level: 10, requiredLevel: 56, spCost: 48000, mpCost: 52, power: 47 },
    { level: 11, requiredLevel: 58, spCost: 120000, mpCost: 54, power: 49 },
    { level: 12, requiredLevel: 60, spCost: 150000, mpCost: 55, power: 51 },
    { level: 13, requiredLevel: 62, spCost: 180000, mpCost: 57, power: 53 },
    { level: 14, requiredLevel: 64, spCost: 240000, mpCost: 59, power: 54 },
    { level: 15, requiredLevel: 66, spCost: 290000, mpCost: 61, power: 56 },
    { level: 16, requiredLevel: 68, spCost: 390000, mpCost: 63, power: 57 },
  ],
};

