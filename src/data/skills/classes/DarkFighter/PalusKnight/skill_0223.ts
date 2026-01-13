import { SkillDefinition } from "../../../types";

// Sting - inflict injury by aiming at weak spot, causes bleeding
export const skill_0223: SkillDefinition = {
  id: 223,
  code: "PK_0223",
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
  hpPerTick: -65, // Will be set from level.power (Level 1-6: 65 HP per 5 sec, Level 7+: 85 HP per 5 sec)
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 2900, mpCost: 23, power: 82 }, // Damage power, bleed: 65
    { level: 2, requiredLevel: 24, spCost: 2900, mpCost: 24, power: 88 }, // Damage power, bleed: 65
    { level: 3, requiredLevel: 24, spCost: 2900, mpCost: 25, power: 95 }, // Damage power, bleed: 65
    { level: 4, requiredLevel: 28, spCost: 4400, mpCost: 27, power: 110 }, // Damage power, bleed: 65
    { level: 5, requiredLevel: 28, spCost: 4400, mpCost: 29, power: 118 }, // Damage power, bleed: 65
    { level: 6, requiredLevel: 28, spCost: 4400, mpCost: 30, power: 127 }, // Damage power, bleed: 65
    { level: 7, requiredLevel: 32, spCost: 7400, mpCost: 31, power: 146 }, // Damage power, bleed: 85
    { level: 8, requiredLevel: 32, spCost: 7400, mpCost: 31, power: 157 }, // Damage power, bleed: 85
    { level: 9, requiredLevel: 32, spCost: 7400, mpCost: 33, power: 168 }, // Damage power, bleed: 85
    { level: 10, requiredLevel: 36, spCost: 9000, mpCost: 35, power: 191 }, // Damage power, bleed: 85
    { level: 11, requiredLevel: 36, spCost: 9000, mpCost: 36, power: 204 }, // Damage power, bleed: 85
    { level: 12, requiredLevel: 36, spCost: 9000, mpCost: 37, power: 217 }, // Damage power, bleed: 85
  ],
};

