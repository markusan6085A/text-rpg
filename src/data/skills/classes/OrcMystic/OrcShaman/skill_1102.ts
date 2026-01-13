import { SkillDefinition } from "../../../types";

// Aura Sink - debuff skill that slowly drains enemy's MP
export const skill_1102: SkillDefinition = {
  id: 1102,
  code: "OS_1102",
  name: "Aura Sink",
  description: "Slowly drains enemy's MP. Effect 3.\n\nМедленно поглощает MP врага.",
  icon: "/skills/skill1102.gif",
  category: "debuff",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  duration: 30,
  chance: 80,
  mpPerTick: -20, // Drains 20 MP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "mentalResist", mode: "multiplier", multiplier: 0 }, // Effectively drains MP
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5800, mpCost: 23, power: 20 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 30, power: 25 },
  ],
};

