import { SkillDefinition } from "../../../types";

// Seal of Flame - magic attack skill that continuously reduces HP of surrounding enemies
export const skill_1108: SkillDefinition = {
  id: 1108,
  code: "OL_1108",
  name: "Seal of Flame",
  description: "A protective ring of fire that continuously reduces HP of surrounding enemies. Effect 5.\n\nЗащитное огненное кольцо, которое непрерывно уменьшает HP окружающих врагов (77 HP каждую секунду).",
  icon: "/skills/skill1108.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "fire",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 15,
  chance: 35,
  stackType: "seal_flame", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  hpPerTick: -77, // Damages 77 HP per tick
  tickInterval: 1, // Every 1 second
  levels: [
    { level: 1, requiredLevel: 48, spCost: 40000, mpCost: 97, power: 77 },
  ],
};

