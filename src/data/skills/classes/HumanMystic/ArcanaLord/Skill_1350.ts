import { SkillDefinition } from "../../../types";

// Warrior Bane
export const skill_1350: SkillDefinition = {
  id: 1350,
  code: "AL_1350",
  name: "Warrior Bane",
  description: "Removes buffs that increase Atk. Spd. and Speed from an enemy.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/Skill1350.jpg",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  chance: 80,
  levels: [{ level: 1, requiredLevel: 76, spCost: 12000000, mpCost: 70, power: 0 }],
};

