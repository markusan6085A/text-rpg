import { SkillDefinition } from "../../../types";

// Spoil Festival - 2 levels
// XML: mpConsume: 73 93, magicLvl: 28 36
export const skill_0302: SkillDefinition = {
  id: 302,
  code: "SC_0302",
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
    { level: 1, requiredLevel: 28, spCost: 13000, mpCost: 73, power: 0 },
    { level: 2, requiredLevel: 36, spCost: 35000, mpCost: 93, power: 0 },
  ],
};

