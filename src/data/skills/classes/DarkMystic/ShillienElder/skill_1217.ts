import { SkillDefinition } from "../../../types";

// Greater Heal - 33 levels from XML
// power: 204, 212, 219, 235, 243, 251, 267, 275, 283, 299, 307, 316, 332, 340, 348, 356, 364, 372, 380, 387, 395, 402, 410, 417, 424, 431, 437, 444, 450, 456, 462, 467, 472
// mpConsume: 46, 48, 49, 51, 52, 54, 57, 59, 61, 64, 64, 66, 69, 71, 72, 74, 76, 77, 78, 78, 80, 81, 83, 84, 86, 87, 89, 90, 91, 92, 93, 95, 96
// hotValue: 15, 15, 15, 18, 18, 18, 18, 23, 23, 23, 23, 23, 23, 23, 27, 27, 27, 27, 27, 27, 27, 27, 31, 31, 31, 31, 31, 31, 31, 31, 31, 35, 35 (heal over time per second for 15 seconds)
const greaterHealPower = [204, 212, 219, 235, 243, 251, 267, 275, 283, 299, 307, 316, 332, 340, 348, 356, 364, 372, 380, 387, 395, 402, 410, 417, 424, 431, 437, 444, 450, 456, 462, 467, 472];
const greaterHealMp = [46, 48, 49, 51, 52, 54, 57, 59, 61, 64, 64, 66, 69, 71, 72, 74, 76, 77, 78, 78, 80, 81, 83, 84, 86, 87, 89, 90, 91, 92, 93, 95, 96];
const greaterHealHot = [15, 15, 15, 18, 18, 18, 18, 23, 23, 23, 23, 23, 23, 23, 27, 27, 27, 27, 27, 27, 27, 27, 31, 31, 31, 31, 31, 31, 31, 31, 31, 35, 35];

export const skill_1217: SkillDefinition = {
  id: 1217,
  code: "DME_1217",
  name: "Greater Heal",
  description: "Recovers HP and applies heal over time.\n\nВосстанавливает HP и применяет лечение со временем.",
  icon: "/skills/skill1217.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  hpPerTick: 0, // Will be set from level.hotValue
  tickInterval: 1, // Every 1 second
  levels: greaterHealPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 40 : index < 6 ? 44 : index < 9 ? 48 : index < 12 ? 52 : index < 15 ? 56 : index < 18 ? 58 : index < 21 ? 60 : index < 24 ? 62 : index < 27 ? 64 : index < 30 ? 66 : 68,
    spCost: index < 3 ? 19000 : index < 6 ? 43000 : index < 9 ? 110000 : index < 12 ? 250000 : index < 15 ? 350000 : index < 18 ? 470000 : index < 21 ? 680000 : index < 24 ? 1000000 : index < 27 ? 1400000 : index < 30 ? 2100000 : 3000000,
    mpCost: greaterHealMp[index],
    power,
    hotValue: greaterHealHot[index], // Heal over time value
  })),
};
