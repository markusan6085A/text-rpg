import { SkillDefinition } from "../../../types";

// Freezing Shackle - powerful freezing attack that reduces enemy's HP while in effect
export const skill_1157: SkillDefinition = {
  id: 1157,
  code: "ES_1157",
  name: "Freezing Shackle",
  description: "Powerful freezing attack that reduces enemy's HP while in effect. Effect 5-7.\n\nМощная ледяная атака, которая уменьшает HP врага во время действия. Эффект 5-7.",
  icon: "/skills/skill1157.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 15,
  chance: 70,
  effects: [
    { stat: "hpRegen", mode: "flat", resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 37000, mpCost: 59, power: -77 },
    { level: 2, requiredLevel: 52, spCost: 95000, mpCost: 70, power: -94 },
    { level: 3, requiredLevel: 64, spCost: 240000, mpCost: 87, power: -117 },
  ],
};

