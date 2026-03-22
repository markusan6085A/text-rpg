// Gludin Village — 9 зон, різна кількість мобів 150–300 на зону, 2 чемпіони, 2–3 РБ; іконки l2dop_* через NPC id; агро — augmentPatrolMobs.

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getGludinVillageL2DopChampions,
  getGludinVillageRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_GLUDIN_VILLAGE_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

type GludinZoneDef = {
  id: string;
  name: string;
  min: number;
  max: number;
  tp: number;
  mobMin: number;
  mobMax: number;
  typesMin: number;
  typesMax: number;
};

function buildGludinVillageZoneMobs(z: GludinZoneDef) {
  const regular = fillZoneMobs(
    L2DOP_GLUDIN_VILLAGE_POOL,
    z.id,
    z.min,
    z.max,
    z.mobMin,
    z.mobMax,
    z.typesMin,
    z.typesMax
  ).map(applyL2XmlDropsToMob);
  const champions = getGludinVillageL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getGludinVillageRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

/** Різні діапазони кількості мобів (150–300) для кожної локації */
const GLUDIN_VILLAGE_ZONE_DEFS: readonly GludinZoneDef[] = [
  { id: "gludin_village_01", name: "Gludin Village — Ferry landing", min: 3, max: 6, tp: 250, mobMin: 150, mobMax: 168, typesMin: 6, typesMax: 13 },
  { id: "gludin_village_02", name: "Gludin Village — Dock warehouses", min: 4, max: 7, tp: 380, mobMin: 162, mobMax: 188, typesMin: 7, typesMax: 14 },
  { id: "gludin_village_03", name: "Gludin Village — Coastal scrub", min: 5, max: 9, tp: 520, mobMin: 175, mobMax: 202, typesMin: 7, typesMax: 15 },
  { id: "gludin_village_04", name: "Gludin Village — Wind-swept path", min: 7, max: 11, tp: 680, mobMin: 188, mobMax: 218, typesMin: 8, typesMax: 16 },
  { id: "gludin_village_05", name: "Gludin Village — Old watchtower hill", min: 9, max: 13, tp: 850, mobMin: 200, mobMax: 235, typesMin: 8, typesMax: 17 },
  { id: "gludin_village_06", name: "Gludin Village — Gull rocks", min: 11, max: 15, tp: 1020, mobMin: 215, mobMax: 252, typesMin: 9, typesMax: 17 },
  { id: "gludin_village_07", name: "Gludin Village — Saltgrass flats", min: 13, max: 17, tp: 1200, mobMin: 228, mobMax: 268, typesMin: 9, typesMax: 18 },
  { id: "gludin_village_08", name: "Gludin Village — Cliffside trail", min: 15, max: 19, tp: 1380, mobMin: 240, mobMax: 285, typesMin: 10, typesMax: 18 },
  { id: "gludin_village_09", name: "Gludin Village — Highland outlook", min: 17, max: 22, tp: 1580, mobMin: 255, mobMax: 300, typesMin: 10, typesMax: 19 },
] as const;

export function buildL2DopGludinVillageZones(): Zone[] {
  return GLUDIN_VILLAGE_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "gludin_village" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildGludinVillageZoneMobs(z),
  }));
}
