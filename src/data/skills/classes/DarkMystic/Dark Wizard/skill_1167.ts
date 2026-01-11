import { SkillDefinition } from "../../../types";

// Poisonous Cloud - 6 levels from XML
// dmg per tick: 54, 72, 93, 114, 132, 144 (damage every 3 seconds, 10 ticks = 30 seconds total)
// mpConsume: 27, 36, 52, 61, 71, 82
// mpConsume_Init: 7, 9, 13, 16, 18, 21
const poisonCloudDmg = [54, 72, 93, 114, 132, 144];
const poisonCloudMp = [27, 36, 52, 61, 71, 82];
const poisonCloudMpInit = [7, 9, 13, 16, 18, 21];
const poisonCloudMagicLvl = [25, 35, 48, 56, 64, 74];

export const skill_1167: SkillDefinition = {
  id: 1167,
  code: "DW_1167",
  name: "Poisonous Cloud",
  description: "Instantaneous poison cloud attack. Effect 3-4.\n\nНаносит эффект яда на 30 сек. с базовым шансом 35% (прохождение зависит от MEN цели), кастуется только на врагов, действует на врагов в радиусе 200 вокруг выбранной цели в пределах дальности 500: - Отнимает у цели по 54-144 HP раз в 5 сек.",
  icon: "/skills/Skill1167_0.jpg",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  duration: 30,
  chance: 35,
  castTime: 4,
  cooldown: 20,
  hpPerTick: 0, // Will be set from level.power
  tickInterval: 3, // Every 3 seconds
  levels: poisonCloudDmg.map((dmg, index) => ({
    level: index + 1,
    requiredLevel: poisonCloudMagicLvl[index],
    spCost: index < 2 ? 5800 : index < 4 ? 18000 : index < 6 ? 50000 : 100000,
    mpCost: poisonCloudMpInit[index] + poisonCloudMp[index],
    power: -dmg, // Negative for damage over time
  })),
};

