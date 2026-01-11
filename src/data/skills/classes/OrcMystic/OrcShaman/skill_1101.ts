import { SkillDefinition } from "../../../types";

// Blaze Quake - magic attack skill that continuously reduces HP of surrounding enemies
export const skill_1101: SkillDefinition = {
  id: 1101,
  code: "OS_1101",
  name: "Blaze Quake",
  description: "A protective ring of fire that continuously reduces HP of surrounding enemies. Effect 3.\n\nЗащитное кольцо огня, которое непрерывно уменьшает HP окружающих врагов.",
  icon: "/skills/skill1101.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "fire",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 15,
  duration: 15,
  chance: 35,
  hpPerTick: -44, // Damages 44 HP per tick
  tickInterval: 1, // Every 1 second
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5800, mpCost: 50, power: 44 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 68, power: 60 },
  ],
};

