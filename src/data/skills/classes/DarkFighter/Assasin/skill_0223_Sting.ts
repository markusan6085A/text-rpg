import { SkillDefinition } from "../../../types";

// Sting - inflict injury by aiming at weak spot, causes bleeding
export const skill_0223_Sting: SkillDefinition = {
  id: 223,
  code: "AS_0223",
  name: "Sting",
  description: "Inflict an injury by aiming at a weak spot and applying damage. Inflicts a serious wound that causes the enemy to bleed momentarily. Usable when a sword, a dagger or a dual-sword is equipped. Over-hit possible.\n\nНаносит рану, целясь в слабое место. Наносит серьезную рану, вызывающую кровотечение. Требуется меч, кинжал или парное оружие. Возможен оверхит.",
  icon: "/skills/skill0223.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 11,
  duration: 20, // Bleed duration
  chance: 50, // Success rate depends on CON stat
  hpPerTick: -65, // Default bleed damage
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 1700, mpCost: 23, power: 41 }, // Power 41 from description
    { level: 2, requiredLevel: 24, spCost: 1700, mpCost: 24, power: 44 }, // Power 44 from description
    { level: 3, requiredLevel: 24, spCost: 1700, mpCost: 25, power: 48 }, // Power 48 from description
    { level: 4, requiredLevel: 28, spCost: 2900, mpCost: 27, power: 55 }, // Power 55 from description
    { level: 5, requiredLevel: 28, spCost: 2900, mpCost: 29, power: 59 }, // Power 59 from description
    { level: 6, requiredLevel: 28, spCost: 2900, mpCost: 30, power: 64 }, // Power 64 from description
    { level: 7, requiredLevel: 32, spCost: 4800, mpCost: 31, power: 73 }, // Power 73 from description
    { level: 8, requiredLevel: 32, spCost: 4800, mpCost: 31, power: 79 }, // Power 79 from description
    { level: 9, requiredLevel: 32, spCost: 4800, mpCost: 33, power: 84 }, // Power 84 from description
    { level: 10, requiredLevel: 36, spCost: 7400, mpCost: 35, power: 96 }, // Power 96 from description
    { level: 11, requiredLevel: 36, spCost: 7400, mpCost: 36, power: 102 }, // Power 102 from description
    { level: 12, requiredLevel: 36, spCost: 7400, mpCost: 37, power: 109 }, // Power 109 from description
  ],
};

