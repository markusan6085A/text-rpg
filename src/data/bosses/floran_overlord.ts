// src/data/bosses/floran_overlord.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";

export interface RaidBoss extends Mob {
  isRaidBoss: true;
  respawnTime: number;
  dropProfileId: string;
  aiProfileId: string;
  zoneId: string;
}

// Ресурси для рейд-босів (високі рівні)
const raidBossResources: string[] = [
  "gold", "mithril_ore", "oriharukon", "adamantite", "blackmithril",
  "crystal", "dragon_scale", "dragon_bone", "fine_steel", "silver"
];

// Функція для генерації дропів ресурсів для рейд-боса (80% шанс)
function generateRaidBossResourceDrops(rbIndex: number): DropEntry[] {
  // Для рейд-босів генеруємо 2-4 ресурси
  const numResources = (rbIndex % 3) + 2;
  const selectedResources: string[] = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceIndex = (rbIndex * 3 + i) % raidBossResources.length;
    const resource = raidBossResources[resourceIndex];
    if (!selectedResources.includes(resource)) {
      selectedResources.push(resource);
    } else {
      const nextResource = raidBossResources[(resourceIndex + 1) % raidBossResources.length];
      if (!selectedResources.includes(nextResource)) {
        selectedResources.push(nextResource);
      }
    }
  }
  
  return selectedResources.map(resource => ({
    id: resource,
    kind: "resource" as const,
    chance: 0.8, // 80% шанс для рейд-босів
    min: 5,
    max: 15,
  }));
}

/* ===========================
   7 РЕЙД БОСІВ ФЛОРАНА
   =========================== */

export const FLORAN_RAID_BOSSES: RaidBoss[] = [
  {
    id: "rb_floran_overlord",
    name: "Raid Boss: Floran Overlord",
    level: 62,
    hp: 750_000,
    mp: 0,
    pAtk: 25_000,
    mAtk: 0,
    pDef: 18_000,
    mDef: 15_000,
    exp: 7_000_000,
    adenaMin: 80_000,
    adenaMax: 140_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 8 * 60 * 60,
    dropProfileId: "rb_floran_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },

  {
    id: "rb_floran_warlord",
    name: "Raid Boss: Floran Warlord",
    level: 64,
    hp: 900_000,
    mp: 0,
    pAtk: 28_000,
    mAtk: 0,
    pDef: 20_000,
    mDef: 16_000,
    exp: 8_500_000,
    adenaMin: 100_000,
    adenaMax: 160_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 9 * 60 * 60,
    dropProfileId: "rb_floran_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },

  {
    id: "rb_floran_chaos_magus",
    name: "Raid Boss: Chaos Magus",
    level: 66,
    hp: 1_200_000,
    mp: 500_000,
    pAtk: 5_000,
    mAtk: 32_000,
    pDef: 12_000,
    mDef: 22_000,
    exp: 10_000_000,
    adenaMin: 120_000,
    adenaMax: 180_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 10 * 60 * 60,
    dropProfileId: "rb_floran_magus_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },

  {
    id: "rb_floran_ancient_guardian",
    name: "Raid Boss: Ancient Guardian",
    level: 68,
    hp: 1_500_000,
    mp: 0,
    pAtk: 32_000,
    mAtk: 0,
    pDef: 24_000,
    mDef: 20_000,
    exp: 12_000_000,
    adenaMin: 140_000,
    adenaMax: 220_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 10 * 60 * 60,
    dropProfileId: "rb_floran_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },

  {
    id: "rb_floran_behemoth",
    name: "Raid Boss: Floran Behemoth",
    level: 70,
    hp: 1_900_000,
    mp: 0,
    pAtk: 38_000,
    mAtk: 0,
    pDef: 28_000,
    mDef: 22_000,
    exp: 15_000_000,
    adenaMin: 180_000,
    adenaMax: 280_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 11 * 60 * 60,
    dropProfileId: "rb_floran_behemoth_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },

  {
    id: "rb_floran_titan_lord",
    name: "Raid Boss: Titan Lord",
    level: 72,
    hp: 2_200_000,
    mp: 0,
    pAtk: 42_000,
    mAtk: 0,
    pDef: 32_000,
    mDef: 25_000,
    exp: 17_000_000,
    adenaMin: 200_000,
    adenaMax: 320_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 12 * 60 * 60,
    dropProfileId: "rb_floran_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },

  {
    id: "rb_floran_death_sorcerer",
    name: "Raid Boss: Death Sorcerer",
    level: 75,
    hp: 100,
    mp: 800_000,
    pAtk: 6_000,
    mAtk: 45_000,
    pDef: 100,
    mDef: 30_000,
    exp: 20_000_000_000,
    sp: 2_000_000_000,
    adenaMin: 240_000_000,
    adenaMax: 400_000,
    dropChance: 1.0,
    drops: [],
    isRaidBoss: true,
    respawnTime: 10,
    dropProfileId: "rb_floran_sorc_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },
];
