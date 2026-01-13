import { SkillDefinition } from "../../../types";

// Mage Bane
export const skill_1351: SkillDefinition = {
  id: 1351,
  code: "AL_1351",
  name: "Mage Bane",
  description: "Removes buffs that increase M. Atk and Casting Spd. from an enemy.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/skill1351.gif",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  chance: 80,
  levels: [{ level: 1, requiredLevel: 77, spCost: 15000000, mpCost: 70, power: 0 }],
};

