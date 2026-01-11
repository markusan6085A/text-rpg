import { SkillDefinition } from "../../../types";

// Chill Flame - magic attack skill that continuously drains enemy's HP
export const skill_1100: SkillDefinition = {
  id: 1100,
  code: "OM_1100",
  name: "Chill Flame",
  description: "Freezing flames that continuously drain enemy's HP. Effect 1.\n\nЗамораживающее пламя, которое непрерывно поглощает HP врага.",
  icon: "/skills/skill1100.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "water",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 15,
  chance: 70,
  hpPerTick: -20, // Damages 20 HP per tick
  tickInterval: 1, // Every 1 second
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 15, power: 20 },
    { level: 2, requiredLevel: 14, spCost: 1800, mpCost: 23, power: 30 },
  ],
};

