import { SkillDefinition } from "../../../types";

// Poison - instantly poisons enemy (continuation from Palus Knight)
export const skill_0129: SkillDefinition = {
  id: 129,
  code: "BD_0129",
  name: "Poison",
  description: "Instantly poisons enemy. Effect 5.\n\nМгновенно отравляет врага. Эффект 5.",
  icon: "/skills/skill0129.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 9,
  duration: 30,
  chance: 70,
  hpPerTick: -155, // Will be set from level
  tickInterval: 5,
  effects: [],
  levels: [
    { level: 2, requiredLevel: 49, spCost: 89000, mpCost: 23, power: 0 },
    { level: 3, requiredLevel: 58, spCost: 240000, mpCost: 28, power: 0 },
    { level: 4, requiredLevel: 66, spCost: 700000, mpCost: 32, power: 0 },
    { level: 5, requiredLevel: 74, spCost: 2300000, mpCost: 35, power: 0 },
  ],
};

