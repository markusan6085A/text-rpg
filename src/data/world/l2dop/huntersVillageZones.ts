// Hunters Village — 9 зон, різна кількість мобів 150–300, 2 чемпіони, 2–3 РБ; моби з XML (рівні 50–72); агро — augmentPatrolMobs.

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getHuntersVillageL2DopChampions,
  getHuntersVillageRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_HUNTERS_VILLAGE_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

type HuntersZoneDef = {
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

function buildHuntersVillageZoneMobs(z: HuntersZoneDef) {
  const regular = fillZoneMobs(
    L2DOP_HUNTERS_VILLAGE_POOL,
    z.id,
    z.min,
    z.max,
    z.mobMin,
    z.mobMax,
    z.typesMin,
    z.typesMax
  ).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const champions = getHuntersVillageL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = getHuntersVillageRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const HUNTERS_VILLAGE_ZONE_DEFS: readonly HuntersZoneDef[] = [
  { id: "hunters_village_01", name: "Hunters Village — Lodge outskirts", min: 50, max: 54, tp: 22_000, mobMin: 150, mobMax: 168, typesMin: 6, typesMax: 13 },
  { id: "hunters_village_02", name: "Hunters Village — Trophy yard", min: 52, max: 56, tp: 22_800, mobMin: 162, mobMax: 188, typesMin: 7, typesMax: 14 },
  { id: "hunters_village_03", name: "Hunters Village — Game trail east", min: 54, max: 58, tp: 23_600, mobMin: 175, mobMax: 202, typesMin: 7, typesMax: 15 },
  { id: "hunters_village_04", name: "Hunters Village — Ridge stalk", min: 56, max: 60, tp: 24_400, mobMin: 188, mobMax: 218, typesMin: 8, typesMax: 16 },
  { id: "hunters_village_05", name: "Hunters Village — Bloodmark copse", min: 58, max: 62, tp: 25_200, mobMin: 200, mobMax: 235, typesMin: 8, typesMax: 17 },
  { id: "hunters_village_06", name: "Hunters Village — Spearfall plateau", min: 60, max: 65, tp: 26_000, mobMin: 215, mobMax: 252, typesMin: 9, typesMax: 17 },
  { id: "hunters_village_07", name: "Hunters Village — Wyrm watch", min: 62, max: 67, tp: 26_800, mobMin: 228, mobMax: 268, typesMin: 9, typesMax: 18 },
  { id: "hunters_village_08", name: "Hunters Village — Elder hunt grounds", min: 64, max: 70, tp: 27_600, mobMin: 240, mobMax: 285, typesMin: 10, typesMax: 18 },
  { id: "hunters_village_09", name: "Hunters Village — Frontier line", min: 66, max: 72, tp: 28_400, mobMin: 255, mobMax: 300, typesMin: 10, typesMax: 19 },
] as const;

export function buildL2DopHuntersVillageZones(): Zone[] {
  return HUNTERS_VILLAGE_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "hunters_village" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildHuntersVillageZoneMobs(z),
  }));
}
