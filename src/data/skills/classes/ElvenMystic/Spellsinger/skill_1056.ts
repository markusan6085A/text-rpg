import { SkillDefinition } from "../../../types";

// Cancel - removes all the buffs from an enemy
export const skill_1056: SkillDefinition = {
  id: 1056,
  code: "ES_1056",
  name: "Cancel",
  description: "Removes all the buffs from an enemy.\n\nСнимает все баффы с врага с вероятностью 25%.",
  icon: "/skills/skill1056.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 6,
  cooldown: 120,
  chance: 25,
  levels: [
    { level: 1, requiredLevel: 48, spCost: 60000, mpCost: 44, power: 0 },
    { level: 2, requiredLevel: 52, spCost: 95000, mpCost: 48, power: 0 },
    { level: 3, requiredLevel: 56, spCost: 95000, mpCost: 52, power: 0 },
    { level: 4, requiredLevel: 58, spCost: 120000, mpCost: 54, power: 0 },
    { level: 5, requiredLevel: 60, spCost: 150000, mpCost: 55, power: 0 },
    { level: 6, requiredLevel: 62, spCost: 180000, mpCost: 58, power: 0 },
    { level: 7, requiredLevel: 64, spCost: 240000, mpCost: 60, power: 0 },
    { level: 8, requiredLevel: 66, spCost: 290000, mpCost: 62, power: 0 },
  ],
};

