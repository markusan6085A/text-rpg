// src/data/zones/mammon_treasury.ts
// Скарбниця Мамона — моб Збирач Мамона дропає кристали LS (Lucky Strike)

import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";

// Дроп LS кристалів — C найчастіше, S найрідше
const LS_CRYSTAL_DROPS: DropEntry[] = [
  { id: "crystal_lucky_strike_c", kind: "resource", chance: 0.25, min: 1, max: 2 },
  { id: "crystal_lucky_strike_b", kind: "resource", chance: 0.12, min: 1, max: 1 },
  { id: "crystal_lucky_strike_a", kind: "resource", chance: 0.05, min: 1, max: 1 },
  { id: "crystal_lucky_strike_s", kind: "resource", chance: 0.02, min: 1, max: 1 },
];

// Базові ресурси для спойлу (як у інших зонах)
const RESOURCE_SPOILS: string[] = [
  "coal", "animal_bone", "varnish", "iron_ore", "adamantite_nugget", "mithril_ore",
];

function createMobStats(level: number) {
  const baseHp = 100 + level * 50;
  const basePAtk = 20 + level * 5;
  const basePDef = 15 + level * 4;
  const baseMDef = 10 + level * 3;
  const baseExp = 80 + level * 25;
  const baseAdena = 30 + level * 12;
  return {
    level,
    hp: baseHp,
    mp: 0,
    pAtk: basePAtk,
    mAtk: 0,
    pDef: basePDef,
    mDef: baseMDef,
    exp: baseExp,
    sp: Math.round(level * 2),
    adenaMin: baseAdena,
    adenaMax: Math.round(baseAdena * 1.5),
    dropChance: 0.4,
  };
}

function generateSpoils(): DropEntry[] {
  return RESOURCE_SPOILS.slice(0, 4).map((resource, idx) => ({
    id: resource,
    kind: "resource" as const,
    chance: 0.35 + idx * 0.05,
    min: 1,
    max: 2,
  }));
}

// Збирач Мамона — основний моб для фарму LS кристалів
const normalMobs: Mob[] = [];
for (let i = 0; i < 15; i++) {
  const level = 38 + Math.floor(i / 5) * 4; // 38-50
  const stats = createMobStats(level);
  normalMobs.push({
    id: `mammon_collector_${i}`,
    name: "Збирач Мамона",
    ...stats,
    drops: [...LS_CRYSTAL_DROPS],
    spoil: generateSpoils(),
  });
}

export const MAMMON_TREASURY_MOBS: Mob[] = normalMobs;
