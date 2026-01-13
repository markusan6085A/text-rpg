import { SkillDefinition } from "../../../types";

// Venom - debuff skill that applies poison damage over time
export const skill_1095: SkillDefinition = {
  id: 1095,
  code: "WC_1095",
  name: "Venom",
  description: "Instantaneous poison attack. Effect 5-6.\n\nМгновенная атака ядом, наносящая урон в течение 30 секунд (155-190 HP каждые 5 секунд).",
  icon: "/skills/skill1095.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  duration: 30,
  chance: 70,
  hpPerTick: -155, // Poison damage per tick
  tickInterval: 5, // Every 5 seconds
  levels: [
    { level: 4, requiredLevel: 40, spCost: 27000, mpCost: 35, power: 155 },
    { level: 5, requiredLevel: 52, spCost: 95000, mpCost: 48, power: 190 },
  ],
  stackType: "venom", // Unique stackType - different levels replace each other
};

