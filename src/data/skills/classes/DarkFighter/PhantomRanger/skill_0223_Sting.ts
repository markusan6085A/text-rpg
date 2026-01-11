import { SkillDefinition } from "../../../types";

// Sting - inflict injury by aiming at weak spot, causes bleeding (continuation from Assassin lv.13-49)
export const skill_0223_Sting: SkillDefinition = {
  id: 223,
  code: "PR_0223",
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
  hpPerTick: -110, // Default bleed damage (varies by level: 85 for lv.13-14, 110 for lv.15-24, 135 for lv.25-33, 155 for lv.34-44, 170 for lv.45-49)
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 13, requiredLevel: 40, spCost: 11000, mpCost: 40, power: 123 }, // Power 123, damage 246, bleed 85 HP
    { level: 14, requiredLevel: 40, spCost: 11000, mpCost: 41, power: 131 }, // Power 131, damage 262, bleed 85 HP
    { level: 15, requiredLevel: 40, spCost: 11000, mpCost: 43, power: 139 }, // Power 139, damage 278, bleed 110 HP
    { level: 16, requiredLevel: 43, spCost: 11000, mpCost: 43, power: 148 }, // Power 148, damage 295, bleed 110 HP
    { level: 17, requiredLevel: 43, spCost: 11000, mpCost: 44, power: 157 }, // Power 157, damage 313, bleed 110 HP
    { level: 18, requiredLevel: 43, spCost: 11000, mpCost: 45, power: 166 }, // Power 166, damage 331, bleed 110 HP
    { level: 19, requiredLevel: 46, spCost: 15000, mpCost: 47, power: 175 }, // Power 175, damage 350, bleed 110 HP
    { level: 20, requiredLevel: 46, spCost: 15000, mpCost: 48, power: 185 }, // Power 185, damage 370, bleed 110 HP
    { level: 21, requiredLevel: 46, spCost: 15000, mpCost: 49, power: 196 }, // Power 196, damage 391, bleed 110 HP
    { level: 22, requiredLevel: 49, spCost: 25000, mpCost: 51, power: 206 }, // Power 206, damage 412, bleed 110 HP
    { level: 23, requiredLevel: 49, spCost: 25000, mpCost: 52, power: 217 }, // Power 217, damage 434, bleed 110 HP
    { level: 24, requiredLevel: 49, spCost: 25000, mpCost: 54, power: 229 }, // Power 229, damage 457, bleed 110 HP
    { level: 25, requiredLevel: 52, spCost: 42000, mpCost: 55, power: 241 }, // Power 241, damage 481, bleed 135 HP
    { level: 26, requiredLevel: 52, spCost: 42000, mpCost: 55, power: 253 }, // Power 253, damage 506, bleed 135 HP
    { level: 27, requiredLevel: 52, spCost: 42000, mpCost: 56, power: 266 }, // Power 266, damage 531, bleed 135 HP
    { level: 28, requiredLevel: 55, spCost: 56000, mpCost: 58, power: 279 }, // Power 279, damage 557, bleed 135 HP
    { level: 29, requiredLevel: 55, spCost: 56000, mpCost: 59, power: 292 }, // Power 292, damage 584, bleed 135 HP
    { level: 30, requiredLevel: 55, spCost: 56000, mpCost: 61, power: 306 }, // Power 306, damage 611, bleed 135 HP
    { level: 31, requiredLevel: 58, spCost: 62000, mpCost: 62, power: 320 }, // Power 320, damage 639, bleed 135 HP
    { level: 32, requiredLevel: 58, spCost: 62000, mpCost: 63, power: 334 }, // Power 334, damage 668, bleed 135 HP
    { level: 33, requiredLevel: 58, spCost: 62000, mpCost: 65, power: 349 }, // Power 349, damage 697, bleed 135 HP
    { level: 34, requiredLevel: 60, spCost: 120000, mpCost: 66, power: 364 }, // Power 364, damage 727, bleed 135 HP
    { level: 35, requiredLevel: 60, spCost: 120000, mpCost: 68, power: 379 }, // Power 379, damage 758, bleed 155 HP
    { level: 36, requiredLevel: 62, spCost: 150000, mpCost: 68, power: 395 }, // Power 395, damage 789, bleed 155 HP
    { level: 37, requiredLevel: 62, spCost: 150000, mpCost: 69, power: 410 }, // Power 410, damage 820, bleed 155 HP
    { level: 38, requiredLevel: 64, spCost: 180000, mpCost: 70, power: 426 }, // Power 426, damage 852, bleed 155 HP
    { level: 39, requiredLevel: 64, spCost: 180000, mpCost: 72, power: 443 }, // Power 443, damage 885, bleed 155 HP
    { level: 40, requiredLevel: 66, spCost: 250000, mpCost: 73, power: 459 }, // Power 459, damage 917, bleed 155 HP
    { level: 41, requiredLevel: 66, spCost: 250000, mpCost: 74, power: 475 }, // Power 475, damage 950, bleed 155 HP
    { level: 42, requiredLevel: 68, spCost: 300000, mpCost: 75, power: 492 }, // Power 492, damage 984, bleed 155 HP
    { level: 43, requiredLevel: 68, spCost: 300000, mpCost: 77, power: 509 }, // Power 509, damage 1017, bleed 155 HP
    { level: 44, requiredLevel: 70, spCost: 360000, mpCost: 78, power: 526 }, // Power 526, damage 1051, bleed 155 HP
    { level: 45, requiredLevel: 70, spCost: 360000, mpCost: 79, power: 542 }, // Power 542, damage 1084, bleed 170 HP
    { level: 46, requiredLevel: 72, spCost: 580000, mpCost: 80, power: 559 }, // Power 559, damage 1118, bleed 170 HP
    { level: 47, requiredLevel: 72, spCost: 580000, mpCost: 81, power: 576 }, // Power 576, damage 1151, bleed 170 HP
    { level: 48, requiredLevel: 74, spCost: 820000, mpCost: 82, power: 593 }, // Power 593, damage 1185, bleed 170 HP
    { level: 49, requiredLevel: 74, spCost: 820000, mpCost: 83, power: 609 }, // Power 609, damage 1218, bleed 170 HP
  ],
};

