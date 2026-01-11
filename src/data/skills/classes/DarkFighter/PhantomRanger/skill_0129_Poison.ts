import { SkillDefinition } from "../../../types";

// Poison - instantly poisons enemy (continuation from Assassin lv.2-5)
export const skill_0129_Poison: SkillDefinition = {
  id: 129,
  code: "PR_0129",
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
  hpPerTick: -155, // Default poison damage for level 2
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 2, requiredLevel: 49, spCost: 75000, mpCost: 23, power: 155 }, // 155 HP damage per 5 sec
    { level: 3, requiredLevel: 58, spCost: 180000, mpCost: 28, power: 190 }, // 190 HP damage per 5 sec
    { level: 4, requiredLevel: 66, spCost: 500000, mpCost: 32, power: 220 }, // 220 HP damage per 5 sec
    { level: 5, requiredLevel: 74, spCost: 1600000, mpCost: 35, power: 240 }, // 240 HP damage per 5 sec
  ],
};

