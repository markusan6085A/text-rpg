import { SkillDefinition } from "../../../types";

// Lightning Strike - strikes down with lightning, temporarily paralyzes target
export const skill_0279: SkillDefinition = {
  id: 279,
  code: "SK_0279",
  name: "Lightning Strike",
  description: "Strikes down with lightning. Temporarily paralyzes the target. The target doesn't get an additional paralysis while it takes effect.\n\nУдаряет молнией. Временно парализует цель. Цель не получает дополнительного паралича, пока действует эффект.",
  icon: "/skills/skill0279.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 120,
  duration: 2, // Paralysis duration
  chance: 20, // Success rate depends on WIT stat
  effects: [
    { stat: "paralyzeResist", mode: "multiplier", multiplier: 0 }, // Effectively paralyzes target
  ],
  levels: [
    { level: 1, requiredLevel: 60, spCost: 140000, mpCost: 54, power: 82 },
    { level: 2, requiredLevel: 62, spCost: 240000, mpCost: 58, power: 89 },
    { level: 3, requiredLevel: 66, spCost: 410000, mpCost: 62, power: 96 },
    { level: 4, requiredLevel: 70, spCost: 510000, mpCost: 65, power: 102 },
    { level: 5, requiredLevel: 74, spCost: 1400000, mpCost: 69, power: 108 },
  ],
};

