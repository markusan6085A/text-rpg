import { SkillDefinition } from "../../../types";

// Seal of Poison - 6 levels from XML (aura skill, poisons enemies)
// dmg per tick: 54, 72, 93, 114, 132, 144 (damage every 3 seconds, 10 ticks = 30 seconds)
// mpConsume: 23, 32, 42, 56, 69, 78
const poisonDmg = [54, 72, 93, 114, 132, 144];
const poisonMp = [23, 32, 42, 56, 69, 78];

export const skill_1209: SkillDefinition = {
  id: 1209,
  code: "DME_1209",
  name: "Seal of Poison",
  description: "Aura skill that poisons nearby enemies, dealing damage over time.\n\nАура, отравляющая ближайших врагов, нанося урон со временем.",
  icon: "/skills/skill1209.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "party",
  castTime: 4,
  cooldown: 15,
  duration: 30,
  chance: 35,
  hpPerTick: 0, // Will be set from level.power
  tickInterval: 3,
  levels: poisonDmg.map((dmg, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 40 : index < 4 ? 52 : 62,
    spCost: index < 2 ? 39000 : index < 4 ? 140000 : 360000,
    mpCost: poisonMp[index],
    power: -dmg, // Negative for damage over time
  })),
};
