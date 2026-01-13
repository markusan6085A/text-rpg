import { SkillDefinition } from "../../../types";

// Greater Group Heal - 33 levels from XML
// power: 163, 179, 175, 188, 194, 201, 213, 220, 226, 240, 246, 253, 266, 272, 279, 285, 291, 298, 304, 310, 316, 322, 328, 334, 339, 345, 350, 355, 360, 365, 369, 374, 378
// mpConsume: 92, 95, 97, 101, 104, 107, 114, 118, 121, 127, 127, 131, 138, 141, 144, 148, 151, 154, 156, 156, 159, 162, 165, 168, 171, 174, 177, 179, 182, 184, 186, 189, 191
// hotValue: 12, 12, 12, 12, 12, 12, 12, 15, 18, 18, 18, 18, 18, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 27, 27, 27, 27, 27, 27, 27 (heal over time per second for 15 seconds)
const greaterGroupHealPower = [163, 179, 175, 188, 194, 201, 213, 220, 226, 240, 246, 253, 266, 272, 279, 285, 291, 298, 304, 310, 316, 322, 328, 334, 339, 345, 350, 355, 360, 365, 369, 374, 378];
const greaterGroupHealMp = [92, 95, 97, 101, 104, 107, 114, 118, 121, 127, 127, 131, 138, 141, 144, 148, 151, 154, 156, 156, 159, 162, 165, 168, 171, 174, 177, 179, 182, 184, 186, 189, 191];
const greaterGroupHealHot = [12, 12, 12, 12, 12, 12, 12, 15, 18, 18, 18, 18, 18, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 27, 27, 27, 27, 27, 27, 27];

export const skill_1219: SkillDefinition = {
  id: 1219,
  code: "DME_1219",
  name: "Greater Group Heal",
  description: "Recovers party member's HP and applies heal over time.\n\nВосстанавливает HP членов группы и применяет лечение со временем.",
  icon: "/skills/skill1219.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "party",
  castTime: 7,
  cooldown: 25,
  hpPerTick: 0, // Will be set from level.hotValue
  tickInterval: 1, // Every 1 second
  levels: greaterGroupHealPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 40 : index < 6 ? 44 : index < 9 ? 48 : index < 12 ? 52 : index < 15 ? 56 : index < 18 ? 58 : index < 21 ? 60 : index < 24 ? 62 : index < 27 ? 64 : index < 30 ? 66 : 68,
    spCost: index < 3 ? 19000 : index < 6 ? 43000 : index < 9 ? 110000 : index < 12 ? 250000 : index < 15 ? 350000 : index < 18 ? 470000 : index < 21 ? 680000 : index < 24 ? 1000000 : index < 27 ? 1400000 : index < 30 ? 2100000 : 3000000,
    mpCost: greaterGroupHealMp[index],
    power,
    hotValue: greaterGroupHealHot[index], // Heal over time value
  })),
};
