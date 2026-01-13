import { SkillDefinition } from "../../../types";

// Ice Dagger - a blade of ice that causes enemy to bleed
export const skill_1183: SkillDefinition = {
  id: 1183,
  code: "ES_1183",
  name: "Ice Dagger",
  description: "A blade of ice that causes enemy to bleed. Power 28-48. Effect 5-7.\n\nЛедяной кинжал, который вызывает кровотечение у врага. Сила 28-48. Эффект 5-7.",
  icon: "/skills/skill1183.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "water",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 8,
  duration: 20,
  chance: 50,
  effects: [
    { stat: "bleed", mode: "flat", value: 110, resistStat: "con" },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 18000, mpCost: 38, power: 28 },
    { level: 2, requiredLevel: 44, spCost: 18000, mpCost: 40, power: 29 },
    { level: 3, requiredLevel: 48, spCost: 30000, mpCost: 43, power: 31 },
    { level: 4, requiredLevel: 48, spCost: 30000, mpCost: 45, power: 33 },
    { level: 5, requiredLevel: 52, spCost: 47000, mpCost: 48, power: 34 },
    { level: 6, requiredLevel: 52, spCost: 47000, mpCost: 49, power: 36 },
    { level: 7, requiredLevel: 56, spCost: 48000, mpCost: 52, power: 38 },
    { level: 8, requiredLevel: 56, spCost: 48000, mpCost: 54, power: 39 },
    { level: 9, requiredLevel: 58, spCost: 120000, mpCost: 57, power: 41 },
    { level: 10, requiredLevel: 60, spCost: 150000, mpCost: 59, power: 43 },
    { level: 11, requiredLevel: 62, spCost: 180000, mpCost: 62, power: 44 },
    { level: 12, requiredLevel: 64, spCost: 240000, mpCost: 64, power: 46 },
    { level: 13, requiredLevel: 66, spCost: 290000, mpCost: 67, power: 48 },
  ],
};

