// Rune Township — 8 зон, моби з XML (runeMobs.generated), 220–300 мобів у списку, чемпіони + РБ

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getRuneL2DopChampions,
  getRuneRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_RUNE_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function buildRuneZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_RUNE_POOL, z.id, z.min, z.max, 220, 300, 12, 28).map(applyL2XmlDropsToMob);
  const champions = getRuneL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getRuneRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const RUNE_ZONE_DEFS = [
  { id: "l2dop_rune_01", name: "Rune — Township outskirts & trade road", min: 66, max: 68, tp: 59_000 },
  { id: "l2dop_rune_02", name: "Rune — Northern moor approach", min: 67, max: 70, tp: 60_500 },
  { id: "l2dop_rune_03", name: "Rune — Frostworn paths", min: 69, max: 72, tp: 62_000 },
  { id: "l2dop_rune_04", name: "Rune — Beastlord ranges", min: 71, max: 74, tp: 63_500 },
  { id: "l2dop_rune_05", name: "Rune — Whispering ruins", min: 73, max: 76, tp: 65_000 },
  { id: "l2dop_rune_06", name: "Rune — Ancient sentinel grounds", min: 75, max: 78, tp: 66_500 },
  { id: "l2dop_rune_07", name: "Rune — Valley of ash offerings", min: 77, max: 80, tp: 68_000 },
  { id: "l2dop_rune_08", name: "Rune — Tyrant's threshold", min: 79, max: 82, tp: 69_500 },
] as const;

export function buildL2DopRuneZones(): Zone[] {
  return RUNE_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_rune" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildRuneZoneMobs(z),
  }));
}
