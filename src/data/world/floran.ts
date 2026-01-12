// src/data/world/floran.ts
import type { City, Zone, Mob } from "./types";

import { FLORAN_RAID_LAIR_MOBS } from "../zones/floran_raid_lair";
import { FLORAN_OUTSKIRTS_MOBS } from "../zones/floran_outskirts";
import { FLORAN_PLAINS_MOBS } from "../zones/floran_plains";
import { FLORAN_FOREST_MOBS } from "../zones/floran_forest";
import { FLORAN_VALLEY_MOBS } from "../zones/floran_valley";
import { FLORAN_HILLS_MOBS } from "../zones/floran_hills";
import { FLORAN_HIGHLANDS_MOBS } from "../zones/floran_highlands";
import { FLORAN_PEAKS_MOBS } from "../zones/floran_peaks";
import { FLORAN_CATACOMBS_MOBS } from "../zones/floran_catacombs";

export const FLORAN_CITY: City = {
  id: "floran",
  name: "Floran",
  tpCost: 12_000,
};

export const FLORAN_ZONES: Zone[] = [
  {
    id: "floran_outskirts",
    name: "Floran Outskirts",
    minLevel: 1,
    maxLevel: 6,
    tpCost: 500,
    cityId: "floran",
    mobs: FLORAN_OUTSKIRTS_MOBS as Mob[],
  },
  {
    id: "floran_plains",
    name: "Floran Plains",
    minLevel: 3,
    maxLevel: 10,
    tpCost: 1000,
    cityId: "floran",
    mobs: FLORAN_PLAINS_MOBS as Mob[],
  },
  {
    id: "floran_forest",
    name: "Floran Forest",
    minLevel: 7,
    maxLevel: 16,
    tpCost: 2000,
    cityId: "floran",
    mobs: FLORAN_FOREST_MOBS as Mob[],
  },
  {
    id: "floran_valley",
    name: "Floran Valley",
    minLevel: 6,
    maxLevel: 20,
    tpCost: 3000,
    cityId: "floran",
    mobs: FLORAN_VALLEY_MOBS as Mob[],
  },
  {
    id: "floran_hills",
    name: "Floran Hills",
    minLevel: 12,
    maxLevel: 24,
    tpCost: 4000,
    cityId: "floran",
    mobs: FLORAN_HILLS_MOBS as Mob[],
  },
  {
    id: "floran_highlands",
    name: "Floran Highlands",
    minLevel: 20,
    maxLevel: 28,
    tpCost: 5000,
    cityId: "floran",
    mobs: FLORAN_HIGHLANDS_MOBS as Mob[],
  },
  {
    id: "floran_peaks",
    name: "Floran Peaks",
    minLevel: 25,
    maxLevel: 36,
    tpCost: 6000,
    cityId: "floran",
    mobs: FLORAN_PEAKS_MOBS as Mob[],
  },
  {
    id: "floran_raid_lair",
    name: "Floran Raid Lair",
    minLevel: 60,
    maxLevel: 70,
    tpCost: 12_000,
    cityId: "floran",
    mobs: FLORAN_RAID_LAIR_MOBS as Mob[],
  },
  {
    id: "floran_catacombs",
    name: "Floran Catacombs",
    minLevel: 20,
    maxLevel: 35,
    tpCost: 3500,
    cityId: "floran",
    mobs: FLORAN_CATACOMBS_MOBS as Mob[],
    allMobsAggressive: true, // Всі моби на сторінці атакують одночасно
    curseChanceOnAttack: 0.1, // 10% шанс на прокляття при атаці
  },
];
