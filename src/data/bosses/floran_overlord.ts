// src/data/bosses/floran_overlord.ts
import type { Mob } from "../world/types";

export interface RaidBoss extends Mob {
  isRaidBoss: true;
  respawnTime: number;
  dropProfileId: string;
  aiProfileId: string;
  zoneId: string;
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
    exp: 7_000_000,
    adenaMin: 400_000,
    adenaMax: 700_000,
    dropChance: 1.0,
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
    exp: 8_500_000,
    adenaMin: 500_000,
    adenaMax: 800_000,
    dropChance: 1.0,
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
    exp: 10_000_000,
    adenaMin: 600_000,
    adenaMax: 900_000,
    dropChance: 1.0,
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
    exp: 12_000_000,
    adenaMin: 700_000,
    adenaMax: 1_100_000,
    dropChance: 1.0,
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
    exp: 15_000_000,
    adenaMin: 900_000,
    adenaMax: 1_400_000,
    dropChance: 1.0,
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
    exp: 17_000_000,
    adenaMin: 1_000_000,
    adenaMax: 1_600_000,
    dropChance: 1.0,
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
    hp: 500,
    exp: 5_000_000,
    sp: 2_000_000,
    adenaMin: 1_200_000,
    adenaMax: 2_000_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 12 * 60 * 60,
    dropProfileId: "rb_floran_sorc_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_raid_lair"
  },
];
