import { SkillDefinition } from "../../../types";

// Sting - inflict injury by aiming at weak spot, causes bleeding (continuation from Palus Knight)
export const skill_0223: SkillDefinition = {
  id: 223,
  code: "SK_0223",
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
  hpPerTick: -170, // Level 13-15: 110 HP per 5 sec, Level 16-24: 110 HP, Level 25-35: 135 HP, Level 36-41: 155 HP, Level 42-49: 170 HP (using max value)
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 13, requiredLevel: 40, spCost: 10000, mpCost: 40, power: 123 }, // Damage power, bleed: 110
    { level: 14, requiredLevel: 40, spCost: 10000, mpCost: 41, power: 131 }, // Damage power, bleed: 110
    { level: 15, requiredLevel: 40, spCost: 10000, mpCost: 43, power: 139 }, // Damage power, bleed: 110
    { level: 16, requiredLevel: 43, spCost: 11000, mpCost: 43, power: 148 }, // Damage power, bleed: 110
    { level: 17, requiredLevel: 43, spCost: 11000, mpCost: 44, power: 157 }, // Damage power, bleed: 110
    { level: 18, requiredLevel: 43, spCost: 11000, mpCost: 45, power: 166 }, // Damage power, bleed: 110
    { level: 19, requiredLevel: 46, spCost: 13000, mpCost: 47, power: 175 }, // Damage power, bleed: 110
    { level: 20, requiredLevel: 46, spCost: 13000, mpCost: 48, power: 185 }, // Damage power, bleed: 110
    { level: 21, requiredLevel: 46, spCost: 13000, mpCost: 49, power: 196 }, // Damage power, bleed: 110
    { level: 22, requiredLevel: 49, spCost: 19000, mpCost: 51, power: 206 }, // Damage power, bleed: 110
    { level: 23, requiredLevel: 49, spCost: 19000, mpCost: 52, power: 217 }, // Damage power, bleed: 110
    { level: 24, requiredLevel: 49, spCost: 19000, mpCost: 54, power: 229 }, // Damage power, bleed: 110
    { level: 25, requiredLevel: 52, spCost: 31000, mpCost: 55, power: 241 }, // Damage power, bleed: 135
    { level: 26, requiredLevel: 52, spCost: 31000, mpCost: 55, power: 253 }, // Damage power, bleed: 135
    { level: 27, requiredLevel: 52, spCost: 31000, mpCost: 56, power: 266 }, // Damage power, bleed: 135
    { level: 28, requiredLevel: 55, spCost: 43000, mpCost: 58, power: 279 }, // Damage power, bleed: 135
    { level: 29, requiredLevel: 55, spCost: 43000, mpCost: 59, power: 292 }, // Damage power, bleed: 135
    { level: 30, requiredLevel: 55, spCost: 43000, mpCost: 61, power: 306 }, // Damage power, bleed: 135
    { level: 31, requiredLevel: 58, spCost: 47000, mpCost: 62, power: 320 }, // Damage power, bleed: 135
    { level: 32, requiredLevel: 58, spCost: 47000, mpCost: 63, power: 334 }, // Damage power, bleed: 135
    { level: 33, requiredLevel: 58, spCost: 47000, mpCost: 65, power: 349 }, // Damage power, bleed: 135
    { level: 34, requiredLevel: 60, spCost: 90000, mpCost: 66, power: 364 }, // Damage power, bleed: 135
    { level: 35, requiredLevel: 60, spCost: 90000, mpCost: 68, power: 379 }, // Damage power, bleed: 155
    { level: 36, requiredLevel: 62, spCost: 120000, mpCost: 68, power: 395 }, // Damage power, bleed: 155
    { level: 37, requiredLevel: 62, spCost: 120000, mpCost: 69, power: 410 }, // Damage power, bleed: 155
    { level: 38, requiredLevel: 64, spCost: 150000, mpCost: 70, power: 425 }, // Damage power, bleed: 155
    { level: 39, requiredLevel: 64, spCost: 150000, mpCost: 71, power: 441 }, // Damage power, bleed: 155
    { level: 40, requiredLevel: 66, spCost: 210000, mpCost: 73, power: 459 }, // Damage power, bleed: 155
    { level: 41, requiredLevel: 66, spCost: 210000, mpCost: 74, power: 475 }, // Damage power, bleed: 155
    { level: 42, requiredLevel: 68, spCost: 240000, mpCost: 75, power: 492 }, // Damage power, bleed: 155
    { level: 43, requiredLevel: 68, spCost: 240000, mpCost: 76, power: 509 }, // Damage power, bleed: 155
    { level: 44, requiredLevel: 70, spCost: 260000, mpCost: 77, power: 526 }, // Damage power, bleed: 155
    { level: 45, requiredLevel: 70, spCost: 260000, mpCost: 79, power: 542 }, // Damage power, bleed: 170
    { level: 46, requiredLevel: 72, spCost: 440000, mpCost: 80, power: 559 }, // Damage power, bleed: 170
    { level: 47, requiredLevel: 72, spCost: 440000, mpCost: 81, power: 576 }, // Damage power, bleed: 170
    { level: 48, requiredLevel: 74, spCost: 680000, mpCost: 82, power: 593 }, // Damage power, bleed: 170
    { level: 49, requiredLevel: 74, spCost: 680000, mpCost: 83, power: 609 }, // Damage power, bleed: 170
  ],
};

