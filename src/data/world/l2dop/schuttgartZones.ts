// Town of Schuttgart — 11 зон, моби з XML (schuttgartMobs.generated), 140–300 мобів, 14 чемпіонів, 4–6 РБ

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getSchuttgartL2DopChampions,
  getSchuttgartRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_SCHUTTGART_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function buildSchuttgartZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_SCHUTTGART_POOL, z.id, z.min, z.max, 140, 300, 12, 28).map(
    applyL2XmlDropsToMob
  );
  const champions = getSchuttgartL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getSchuttgartRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const SCHUTTGART_ZONE_DEFS = [
  { id: "l2dop_schuttgart_01", name: "Schuttgart — Outskirts & supply road", min: 74, max: 76, tp: 46000 },
  { id: "l2dop_schuttgart_02", name: "Schuttgart — Ice march approaches", min: 75, max: 77, tp: 47500 },
  { id: "l2dop_schuttgart_03", name: "Schuttgart — Stakato spike hollows", min: 76, max: 78, tp: 49000 },
  { id: "l2dop_schuttgart_04", name: "Schuttgart — Cannibal brood grounds", min: 77, max: 79, tp: 50500 },
  { id: "l2dop_schuttgart_05", name: "Schuttgart — Monastery exile path", min: 78, max: 80, tp: 52000 },
  { id: "l2dop_schuttgart_06", name: "Schuttgart — Solina pilgrim trails", min: 79, max: 81, tp: 53500 },
  { id: "l2dop_schuttgart_07", name: "Schuttgart — Temple confessors", min: 80, max: 82, tp: 55000 },
  { id: "l2dop_schuttgart_08", name: "Schuttgart — Triol ritual grounds", min: 80, max: 84, tp: 56500 },
  { id: "l2dop_schuttgart_09", name: "Schuttgart — False grail crypts", min: 83, max: 85, tp: 58000 },
  { id: "l2dop_schuttgart_10", name: "Schuttgart — Ancient breeding plains", min: 84, max: 86, tp: 59500 },
  { id: "l2dop_schuttgart_11", name: "Schuttgart — Tyrant ridge", min: 85, max: 87, tp: 61000 },
] as const;

export function buildL2DopSchuttgartZones(): Zone[] {
  return SCHUTTGART_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_schuttgart" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildSchuttgartZoneMobs(z),
  }));
}
