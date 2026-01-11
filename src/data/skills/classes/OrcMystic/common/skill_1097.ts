import { SkillDefinition } from "../../../types";

// Dreaming Spirit - debuff skill that puts target to sleep
export const skill_1097: SkillDefinition = {
  id: 1097,
  code: "OM_1097",
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
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 10, power: 0 },
    { level: 2, requiredLevel: 14, spCost: 1800, mpCost: 15, power: 0 },
  ],
};

