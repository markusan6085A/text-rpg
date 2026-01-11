import { SkillDefinition } from "../../../types";

// Frost Flame - magic attack skill that continuously drains enemy's HP
export const skill_1107: SkillDefinition = {
  id: 1107,
  code: "OS_1107",
  name: "Frost Flame",
  description: "Freezing flames that continuously drain enemy's HP. Effect 3.\n\nЗамораживающее пламя, которое непрерывно поглощает HP врага.",
  icon: "/skills/skill1107.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "water",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 15,
  chance: 70,
  hpPerTick: -44, // Damages 44 HP per tick
  tickInterval: 1, // Every 1 second
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 29, power: 44 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 40, power: 60 },
  ],
};

