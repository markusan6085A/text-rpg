// Floran Village — 6 зон (id починається з floran* для дроп-профілів), 120–250 мобів, 2 чемпіони, 2–3 РБ; агро-патруль додає augmentPatrolMobs.

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getFloranVillageL2DopChampions,
  getFloranVillageRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_FLORAN_VILLAGE_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function buildFloranVillageZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_FLORAN_VILLAGE_POOL, z.id, z.min, z.max, 120, 250, 6, 16).map((m, i) =>
    applyL2XmlDropsToMob(m, z.id, i)
  );
  const champions = getFloranVillageL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = getFloranVillageRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const FLORAN_VILLAGE_ZONE_DEFS = [
  { id: "floran_village_01", name: "Floran Village — Meadow outskirts", min: 10, max: 14, tp: 800 },
  { id: "floran_village_02", name: "Floran Village — River bend", min: 12, max: 17, tp: 1100 },
  { id: "floran_village_03", name: "Floran Village — Wild orchard", min: 15, max: 21, tp: 1500 },
  { id: "floran_village_04", name: "Floran Village — Old stone circle", min: 19, max: 25, tp: 2000 },
  { id: "floran_village_05", name: "Floran Village — Bramble ridge", min: 23, max: 31, tp: 2600 },
  { id: "floran_village_06", name: "Floran Village — Highland border", min: 28, max: 36, tp: 3200 },
] as const;

export function buildL2DopFloranVillageZones(): Zone[] {
  return FLORAN_VILLAGE_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "floran_village" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildFloranVillageZoneMobs(z),
  }));
}
