import { SkillDefinition } from "../../../types";

// Freezing Flame - debuff skill that continuously drains enemy's HP
export const skill_1244: SkillDefinition = {
  id: 1244,
  code: "WC_1244",
  name: "Freezing Flame",
  description: "Freezing flames that continuously drain enemy's HP. Effect 5-8.\n\nЗамораживающие пламена, которые непрерывно уменьшают HP врага (77-118 HP каждую секунду).",
  icon: "/skills/skill1244.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 15,
  chance: 70,
  hpPerTick: -77, // Drains HP per tick
  tickInterval: 1, // Every 1 second
  levels: [
    { level: 1, requiredLevel: 40, spCost: 27000, mpCost: 53, power: 77 },
    { level: 2, requiredLevel: 52, spCost: 95000, mpCost: 70, power: 94 },
    { level: 3, requiredLevel: 64, spCost: 320000, mpCost: 89, power: 108 },
    { level: 4, requiredLevel: 72, spCost: 1100000, mpCost: 100, power: 118 },
  ],
  stackType: "freezing_flame", // Unique stackType - different levels replace each other
};

