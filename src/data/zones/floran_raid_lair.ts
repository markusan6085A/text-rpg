// src/data/zones/floran_raid_lair.ts
import type { Mob } from "../world/types";
import { FLORAN_RAID_BOSSES } from "../bosses/floran_overlord";

export const FLORAN_RAID_LAIR_MOBS: Mob[] = [
  // Міньйони (елітні моби)
  {
    id: "fl_rb_minion_guard",
    name: "Raid Lair Guard",
    level: 62,
    hp: 260_000,
    exp: 220_000,
    adenaMin: 80_000,
    adenaMax: 120_000,
    dropChance: 0.35,
  },
  {
    id: "fl_rb_minion_magus",
    name: "Raid Lair Magus",
    level: 64,
    hp: 290_000,
    exp: 240_000,
    adenaMin: 85_000,
    adenaMax: 130_000,
    dropChance: 0.38,
  },

  // Усі 7 РБ (імпортовані)
  ...FLORAN_RAID_BOSSES,
];
