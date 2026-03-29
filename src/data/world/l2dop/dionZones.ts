// Town of Dion — 11 зон, моби з XML (dionMobs.generated), 220–300 мобів у списку, чемпіони + РБ

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getDionL2DopChampions,
  getDionRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_DION_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";
import { appendEpicRaidBosses } from "./epicRaidBosses";

function buildDionZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_DION_POOL, z.id, z.min, z.max, 220, 300, 12, 28).map((m, i) =>
    applyL2XmlDropsToMob(m, z.id, i)
  );
  const champions = getDionL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = appendEpicRaidBosses(z.id, getDionRaidBossesForZone(z.id));
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const DION_ZONE_DEFS = [
  { id: "l2dop_dion_01", name: "Dion — Hills & shepherd trails", min: 28, max: 30, tp: 14_000 },
  { id: "l2dop_dion_02", name: "Dion — Beehive approaches", min: 29, max: 32, tp: 14_900 },
  { id: "l2dop_dion_03", name: "Dion — Windmill fields", min: 31, max: 34, tp: 15_800 },
  { id: "l2dop_dion_04", name: "Dion — Partisan's watch", min: 33, max: 36, tp: 16_700 },
  { id: "l2dop_dion_05", name: "Dion — Marsh outflow", min: 35, max: 38, tp: 17_600 },
  { id: "l2dop_dion_06", name: "Dion — Cruma approach road", min: 37, max: 40, tp: 18_500 },
  { id: "l2dop_dion_07", name: "Dion — Ancient battleground", min: 39, max: 42, tp: 19_400 },
  { id: "l2dop_dion_08", name: "Dion — Ruined barricades", min: 41, max: 44, tp: 20_300 },
  { id: "l2dop_dion_09", name: "Dion — Fen lord territory", min: 43, max: 46, tp: 21_200 },
  { id: "l2dop_dion_10", name: "Dion — Misty moor", min: 44, max: 47, tp: 22_100 },
  { id: "l2dop_dion_11", name: "Dion — Highland border", min: 46, max: 48, tp: 23_000 },
] as const;

export function buildL2DopDionZones(): Zone[] {
  return DION_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_dion" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildDionZoneMobs(z),
  }));
}
