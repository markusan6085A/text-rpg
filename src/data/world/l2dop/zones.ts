// src/data/world/l2dop/zones.ts
// Локації (зони) з мобами з l2dop — підключаються при USE_L2DOP_WORLD = true

import type { Zone } from "../types";
import {
  L2DOP_GLUDIO_POOL,
  L2DOP_ADEN_POOL,
  fillZoneMobs,
  getGludioL2DopChampions,
  getAdenL2DopChampions,
  getGludioRaidBossesForZone,
  getAdenRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_GIRAN03_2321_MOBS,
} from "./mobs";

/**
 * Локації з l2dop (місто → зони з мобами, дроп, спойл).
 * ID зон починаються з "l2dop_" для коректної роботи DISABLE_OUR_RESOURCES.
 * 8 окрестностей Gludio: 30–200 мобів, 10–20 видів у кожній (детерміновано).
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
    mobs: shuffleMobsRandomly(
      fillZoneMobs(L2DOP_GLUDIO_POOL, z.id, z.min, z.max, 30, 200, 10, 20),
      getGludioL2DopChampions(z.id, z.min, z.max),
      getGludioRaidBossesForZone(z.id),
      z.id
    ),
  })),
  {
    id: "l2dop_giran03_2321_15",
    name: "Giran — Печера (L2)",
    cityId: "l2dop_giran",
    minLevel: 55,
    maxLevel: 65,
    tpCost: 25000,
    mobs: L2DOP_GIRAN03_2321_MOBS,
  },
  // 8 зон Aden (лвл 40–65)
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
    mobs: shuffleMobsRandomly(
      fillZoneMobs(L2DOP_ADEN_POOL, z.id, z.min, z.max, 30, 200, 10, 20),
      getAdenL2DopChampions(z.id, z.min, z.max),
      getAdenRaidBossesForZone(z.id),
      z.id
    ),
  })),
];
