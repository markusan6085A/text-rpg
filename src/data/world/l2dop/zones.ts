// src/data/world/l2dop/zones.ts
// Локації (зони) з l2dop — Gludio L2, Aden L2, Giran L2 з мобами

import type { Zone } from "../types";
import {
  fillZoneMobs,
  getGludioL2DopChampions,
  getGludioRaidBossesForZone,
  getAdenL2DopChampions,
  getAdenRaidBossesForZone,
  getGoddardL2DopChampions,
  getGoddardRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_GLUDIO_POOL,
  L2DOP_ADEN_POOL,
  L2DOP_GIRAN03_2321_MOBS,
  L2DOP_GODDARD_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function buildGludioZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_GLUDIO_POOL, z.id, z.min, z.max, 30, 150, 8, 18).map(applyL2XmlDropsToMob);
  const champions = getGludioL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getGludioRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

function buildAdenZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_ADEN_POOL, z.id, z.min, z.max, 30, 150, 8, 18).map(applyL2XmlDropsToMob);
  const champions = getAdenL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getAdenRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

/** ~200 звичайних мобів на зону (кілька L2-околиць в одній ігровій локації), чемпіони + РБ */
function buildGoddardZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_GODDARD_POOL, z.id, z.min, z.max, 180, 220, 20, 38).map(applyL2XmlDropsToMob);
  const champions = getGoddardL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = getGoddardRaidBossesForZone(z.id);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

/**
 * Локації з l2dop (Gludio L2, Aden L2, Giran L2) з мобами.
 */
export const L2DOP_ZONES: Zone[] = [
  ...[
    { id: "l2dop_gludio_01", name: "Gludio — Окраїна (L2)", min: 1, max: 5, tp: 5000 },
    { id: "l2dop_gludio_02", name: "Gludio — Луги (L2)", min: 3, max: 8, tp: 5500 },
    { id: "l2dop_gludio_03", name: "Gludio — Роща (L2)", min: 5, max: 12, tp: 6500 },
    { id: "l2dop_gludio_04", name: "Gludio — Болото (L2)", min: 10, max: 18, tp: 8500 },
    { id: "l2dop_gludio_05", name: "Gludio — Руїни (L2)", min: 14, max: 22, tp: 10000 },
    { id: "l2dop_gludio_06", name: "Gludio — Ящери (L2)", min: 18, max: 28, tp: 11000 },
    { id: "l2dop_gludio_07", name: "Gludio — Орки (L2)", min: 24, max: 35, tp: 12000 },
    { id: "l2dop_gludio_08", name: "Gludio — Печери (L2)", min: 28, max: 40, tp: 13500 },
  ].map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_gludio" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildGludioZoneMobs(z),
  })),
  {
    id: "l2dop_giran03_2321_15",
    name: "Giran — Печера (L2)",
    cityId: "l2dop_giran",
    minLevel: 55,
    maxLevel: 65,
    tpCost: 25000,
    mobs: L2DOP_GIRAN03_2321_MOBS.map(applyL2XmlDropsToMob),
  },
  ...[
    { id: "l2dop_aden_01", name: "Aden — Окрестность (L2)", min: 40, max: 44, tp: 15000 },
    { id: "l2dop_aden_02", name: "Aden — Долина Вигнанців (L2)", min: 42, max: 48, tp: 16500 },
    { id: "l2dop_aden_03", name: "Aden — Зачарована Долина (L2)", min: 46, max: 52, tp: 18500 },
    { id: "l2dop_aden_04", name: "Aden — Місце Страти (L2)", min: 50, max: 54, tp: 20000 },
    { id: "l2dop_aden_05", name: "Aden — Вогняне Болото (L2)", min: 52, max: 58, tp: 22000 },
    { id: "l2dop_aden_06", name: "Aden — Темні Землі (L2)", min: 56, max: 62, tp: 24500 },
    { id: "l2dop_aden_07", name: "Aden — Підземелля (L2)", min: 58, max: 63, tp: 26500 },
    { id: "l2dop_aden_08", name: "Aden — Фортеця (L2)", min: 60, max: 65, tp: 28500 },
  ].map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_aden" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildAdenZoneMobs(z),
  })),
  ...[
    { id: "l2dop_goddard_01", name: "Годдарт — Гарячі джерела (L2)", min: 73, max: 75, tp: 32000 },
    { id: "l2dop_goddard_02", name: "Годдарт — Стежки джерел і Кетра (L2)", min: 74, max: 77, tp: 34000 },
    { id: "l2dop_goddard_03", name: "Годдарт — Землі Кетра (L2)", min: 75, max: 78, tp: 36000 },
    { id: "l2dop_goddard_04", name: "Годдарт — Кетра і Варка (L2)", min: 76, max: 79, tp: 38000 },
    { id: "l2dop_goddard_05", name: "Годдарт — Землі Варки (L2)", min: 77, max: 80, tp: 40000 },
    { id: "l2dop_goddard_06", name: "Годдарт — Монастир Св. Соліни (L2)", min: 78, max: 80, tp: 42000 },
    { id: "l2dop_goddard_07", name: "Годдарт — Вершини племен (L2)", min: 79, max: 80, tp: 44000 },
  ].map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_goddard" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildGoddardZoneMobs(z),
  })),
];
