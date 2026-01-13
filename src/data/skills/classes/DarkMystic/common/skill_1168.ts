import { SkillDefinition } from "../../../types";

// Curse: Poison - 7 levels from XML
// dmg per tick: 24, 54, 72, 93, 114, 132, 144 (damage every 3 seconds, 10 ticks = 30 seconds total)
// mpConsume: 8, 16, 21, 31, 38, 46, 53
const poisonDmg = [24, 54, 72, 93, 114, 132, 144];
const poisonMp = [8, 16, 21, 31, 38, 46, 53];

export const skill_1168: SkillDefinition = {
  id: 1168,
  code: "DM_1168",
  name: "Curse: Poison",
  description: "Poisons target, dealing damage over time.\n\nОтравляет цель, нанося урон со временем.",
  icon: "/skills/Skill1168_0_panel_2.jpg",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  duration: 30,
  chance: 70,
  castTime: 4,
  cooldown: 12,
  hpPerTick: 0, // Will be set from level.power
  tickInterval: 3, // Every 3 seconds
  effects: [],
  levels: poisonDmg.map((dmg, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 7 : index < 4 ? 20 : index < 6 ? 30 : 40,
    spCost: index < 2 ? 470 : index < 4 ? 3000 : index < 6 ? 8000 : 20000,
    mpCost: poisonMp[index],
    power: -dmg, // Negative for damage over time
  })),
};



