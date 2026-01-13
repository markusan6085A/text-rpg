import { SkillDefinition } from "../../../types";

// Poison - instantly poisons enemy (continuation from Palus Knight)
export const skill_0129: SkillDefinition = {
  id: 129,
  code: "SK_0129",
  name: "Poison",
  description: "Instantly poisons enemy.\n\nМгновенно отравляет врага.",
  icon: "/skills/skill0129.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 9,
  duration: 30,
  chance: 70, // Success rate depends on MEN stat
  hpPerTick: -240, // Level 2: 155 HP per 5 sec, Level 3: 190 HP, Level 4: 220 HP, Level 5: 240 HP (using max value)
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 2, requiredLevel: 49, spCost: 58000, mpCost: 23, power: 0 },
    { level: 3, requiredLevel: 60, spCost: 140000, mpCost: 28, power: 0 },
    { level: 4, requiredLevel: 66, spCost: 410000, mpCost: 32, power: 0 },
    { level: 5, requiredLevel: 74, spCost: 1400000, mpCost: 35, power: 0 },
  ],
};

