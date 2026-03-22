// Heine — 6 зон, моби з XML (heineMobs.generated), 120–250 мобів, 2 чемпіони, 2–3 РБ; агро-патруль — augmentPatrolMobs.

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getHeineL2DopChampions,
  getHeineRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_HEINE_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function buildHeineZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_HEINE_POOL, z.id, z.min, z.max, 120, 250, 6, 16).map(applyL2XmlDropsToMob);
  const champions = getHeineL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getHeineRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const HEINE_ZONE_DEFS = [
  { id: "l2dop_heine_01", name: "Heine — Harbor storehouses", min: 36, max: 40, tp: 8500 },
  { id: "l2dop_heine_02", name: "Heine — Wharf & tide flats", min: 38, max: 43, tp: 9800 },
  { id: "l2dop_heine_03", name: "Heine — Salt road", min: 41, max: 46, tp: 11200 },
  { id: "l2dop_heine_04", name: "Heine — Coral shallows", min: 44, max: 49, tp: 12600 },
  { id: "l2dop_heine_05", name: "Heine — Breakwater cliffs", min: 47, max: 52, tp: 14200 },
  { id: "l2dop_heine_06", name: "Heine — Open sea approach", min: 50, max: 56, tp: 15800 },
] as const;

export function buildL2DopHeineZones(): Zone[] {
  return HEINE_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_heine" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildHeineZoneMobs(z),
  }));
}
