import { SkillDefinition } from "../../../types";

// Seal of Gloom - 4 levels from XML (aura skill, burns MP over time)
// dmg per tick: 21, 24, 30, 36 (MP damage every 3 seconds, 10 ticks = 30 seconds)
// mpConsume: 70, 84, 107, 120
const gloomDmg = [21, 24, 30, 36];
const gloomMp = [70, 84, 107, 120];

export const skill_1210: SkillDefinition = {
  id: 1210,
  code: "DME_1210",
  name: "Seal of Gloom",
  description: "Aura skill that burns MP of nearby enemies over time.\n\nАура, сжигающая MP ближайших врагов со временем.",
  icon: "/skills/skill1210.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "party",
  castTime: 4,
  cooldown: 20,
  duration: 30,
  chance: 40,
  mpPerTick: 0, // Will be set from level.power (MP damage)
  tickInterval: 3,
  levels: gloomDmg.map((dmg, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 44 : index < 4 ? 64 : 72,
    spCost: index < 2 ? 39000 : index < 4 ? 140000 : 360000,
    mpCost: gloomMp[index],
    power: -dmg, // Negative for MP damage over time
  })),
};
