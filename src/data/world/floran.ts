// src/data/world/floran.ts
import type { City, Zone, Mob } from "./types";

import { FLORAN_OUTSKIRTS_MOBS } from "../zones/floran_outskirts";
import { WASTELAND_MOBS } from "../zones/wasteland";
import { FLORAN_CHAMPION_FIELDS_MOBS } from "../zones/floran_champion_fields";
import { FLORAN_RAID_LAIR_MOBS } from "../zones/floran_raid_lair";
import { WASTELAND_WEST_MOBS } from "../zones/wasteland_west";
import { ABANDONED_CAMP_MOBS } from "../zones/abandoned_camp";
import { EXECUTION_GROUNDS_MOBS } from "../zones/execution_grounds";
import { CRUMA_MARSHLANDS_MOBS } from "../zones/cruma_marshlands";



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
    maxLevel: 8,
    tpCost: 200,
    cityId: "floran",
    mobs: FLORAN_OUTSKIRTS_MOBS as Mob[],
  },
  {
    id: "wasteland",
    name: "Wasteland",
    minLevel: 14,
    maxLevel: 22,
    tpCost: 1_200,
    cityId: "floran",
    mobs: WASTELAND_MOBS as Mob[],
  },
  
  {
    id: "wasteland_west",
    name: "Wasteland West",
    minLevel: 22,
    maxLevel: 28,
    tpCost: 1_500,
    cityId: "floran",
    mobs: WASTELAND_WEST_MOBS as Mob[],
 },

  {
   id: "abandoned_camp",
   name: "Abandoned Camp",
   minLevel: 28,
   maxLevel: 36,
   tpCost: 2_200,
   cityId: "floran",
   mobs: ABANDONED_CAMP_MOBS as Mob[],
 },

  {
   id: "execution_grounds",
   name: "Execution Grounds",
   minLevel: 36,
   maxLevel: 44,
   tpCost: 6_200,
   cityId: "floran",
   mobs: EXECUTION_GROUNDS_MOBS as Mob[],
  },

  {
  id: "cruma_marshlands",
  name: "Cruma Marshlands",
  minLevel: 44,
  maxLevel: 52,
  tpCost: 8_400,
  cityId: "floran",
  mobs: CRUMA_MARSHLANDS_MOBS as Mob[],
},

  {
    id: "floran_champion_fields",
    name: "Floran Champion Fields",
    minLevel: 52,
    maxLevel: 60,
    tpCost: 7_000,
    cityId: "floran",
    mobs: FLORAN_CHAMPION_FIELDS_MOBS as Mob[],
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
];
