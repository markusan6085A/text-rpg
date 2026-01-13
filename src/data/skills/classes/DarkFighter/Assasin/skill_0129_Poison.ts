import { SkillDefinition } from "../../../types";

// Poison - instantly poisons enemy
export const skill_0129_Poison: SkillDefinition = {
  id: 129,
  code: "AS_0129",
  name: "Poison",
  description: "Instantly poisons enemy. Effect 3.\n\nМгновенно отравляет врага. Эффект 3.",
  icon: "/skills/skill0129.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 9,
  duration: 30,
  chance: 70, // Success rate depends on MEN stat
  hpPerTick: -90, // 90 HP damage per 5 sec
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 10, power: 90 }, // 90 HP damage per 5 sec
  ],
};

