import { SkillDefinition } from "../../../types";

// Dreaming Spirit - debuff skill (Levels 3-6 for OrcShaman)
export const skill_1097: SkillDefinition = {
  id: 1097,
  code: "OS_1097",
  name: "Dreaming Spirit",
  description: "Instantly puts target to sleep. If cast on a sleeping target, the spell has no effect.\n\nМгновенно усыпляет цель. Если цель уже спит, заклинание не действует.",
  icon: "/skills/skill1097.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 30,
  chance: 80,
  stackType: "dreaming_spirit", // Unique stackType - higher level Dreaming Spirit replaces lower level
  effects: [
    { stat: "sleepResist", mode: "multiplier", multiplier: 0 }, // Effectively puts to sleep
  ],
  levels: [
    { level: 3, requiredLevel: 20, spCost: 2900, mpCost: 20, power: 0 },
    { level: 4, requiredLevel: 25, spCost: 5800, mpCost: 23, power: 0 },
    { level: 5, requiredLevel: 30, spCost: 11000, mpCost: 27, power: 0 },
    { level: 6, requiredLevel: 35, spCost: 18000, mpCost: 30, power: 0 },
  ],
};

