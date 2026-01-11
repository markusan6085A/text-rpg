import { SkillDefinition } from "../../../types";

// Spoil Festival - levels 3-9 (levels 1-2 are in Scavenger)
// XML: mpConsume: 113 131 150 172 183 194 204, magicLvl: 43 49 55 62 66 70 74
export const skill_0302: SkillDefinition = {
  id: 302,
  code: "BH_0302",
  name: "Spoil Festival",
  description: "Throws multiple enemies into a state of Spoil.\n\nБросает нескольких врагов в состояние Spoil.",
  icon: "/skills/skill0302.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 1.8,
  cooldown: 10,
  levels: [
    { level: 3, requiredLevel: 43, spCost: 46000, mpCost: 113, power: 0 },
    { level: 4, requiredLevel: 49, spCost: 110000, mpCost: 131, power: 0 },
    { level: 5, requiredLevel: 55, spCost: 250000, mpCost: 150, power: 0 },
    { level: 6, requiredLevel: 62, spCost: 440000, mpCost: 172, power: 0 },
    { level: 7, requiredLevel: 66, spCost: 780000, mpCost: 183, power: 0 },
    { level: 8, requiredLevel: 70, spCost: 1100000, mpCost: 194, power: 0 },
    { level: 9, requiredLevel: 74, spCost: 2300000, mpCost: 204, power: 0 },
  ],
};

