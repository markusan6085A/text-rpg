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
  getOrenL2DopChampions,
  getOrenRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_GLUDIO_POOL,
  L2DOP_ADEN_POOL,
  L2DOP_GODDARD_POOL,
  L2DOP_OREN_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";
import { buildL2DopGiranZones } from "./giranZones";
import { buildL2DopGoddardEliteZones } from "./goddardEliteZones";
import { buildL2DopSchuttgartZones } from "./schuttgartZones";
import { buildL2DopRuneZones } from "./runeZones";
import { buildL2DopDionZones } from "./dionZones";
import { buildL2DopFloranVillageZones } from "./floranVillageZones";
import { buildL2DopHeineZones } from "./heineZones";
import { buildL2DopHuntersVillageZones } from "./huntersVillageZones";
import { buildL2DopGludinVillageZones } from "./gludinVillageZones";
import { buildL2DopAncientTombFieldsZones } from "./ancientTombFieldsZones";
import { appendEpicRaidBosses } from "./epicRaidBosses";

function buildGludioZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_GLUDIO_POOL, z.id, z.min, z.max, 30, 150, 8, 18).map((m, i) =>
    applyL2XmlDropsToMob(m, z.id, i)
  );
  const champions = getGludioL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = appendEpicRaidBosses(z.id, getGludioRaidBossesForZone(z.id));
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

function buildAdenZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_ADEN_POOL, z.id, z.min, z.max, 30, 150, 8, 18).map((m, i) =>
    applyL2XmlDropsToMob(m, z.id, i)
  );
  const champions = getAdenL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = appendEpicRaidBosses(z.id, getAdenRaidBossesForZone(z.id));
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

/** ~200 звичайних мобів на зону (кілька L2-околиць в одній ігровій локації), чемпіони + РБ */
function buildGoddardZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_GODDARD_POOL, z.id, z.min, z.max, 180, 220, 20, 38).map((m, i) =>
    applyL2XmlDropsToMob(m, z.id, i)
  );
  const champions = getGoddardL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = appendEpicRaidBosses(z.id, getGoddardRaidBossesForZone(z.id));
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

/** 150–300 мобів на зону, пара чемпіонів + РБ (агро патруль додається в Location) */
function buildOrenZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_OREN_POOL, z.id, z.min, z.max, 150, 300, 10, 22).map((m, i) =>
    applyL2XmlDropsToMob(m, z.id, i)
  );
  const champions = getOrenL2DopChampions(z.id, z.min, z.max).map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
  const raidBosses = appendEpicRaidBosses(z.id, getOrenRaidBossesForZone(z.id));
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

/**
 * Локації з l2dop (Gludio L2, Aden L2, Giran L2) з мобами.
 */
export const L2DOP_ZONES: Zone[] = [
  ...[
    { id: "l2dop_gludio_01", name: "Gludio — Окраїна", min: 1, max: 5, tp: 5000 },
    { id: "l2dop_gludio_02", name: "Gludio — Луги", min: 3, max: 8, tp: 5500 },
    { id: "l2dop_gludio_03", name: "Gludio — Роща", min: 5, max: 12, tp: 6500 },
    { id: "l2dop_gludio_04", name: "Gludio — Болото", min: 10, max: 18, tp: 8500 },
    { id: "l2dop_gludio_05", name: "Gludio — Руїни", min: 14, max: 22, tp: 10000 },
    { id: "l2dop_gludio_06", name: "Gludio — Ящери", min: 18, max: 28, tp: 11000 },
    { id: "l2dop_gludio_07", name: "Gludio — Орки", min: 24, max: 35, tp: 12000 },
    { id: "l2dop_gludio_08", name: "Gludio — Печери", min: 28, max: 40, tp: 13500 },
  ].map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_gludio" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildGludioZoneMobs(z),
  })),
  ...buildL2DopGiranZones(),
  ...[
    { id: "l2dop_aden_01", name: "Aden — Окрестность", min: 40, max: 44, tp: 15000 },
    { id: "l2dop_aden_02", name: "Aden — Долина Вигнанців", min: 42, max: 48, tp: 16500 },
    { id: "l2dop_aden_03", name: "Aden — Зачарована Долина", min: 46, max: 52, tp: 18500 },
    { id: "l2dop_aden_04", name: "Aden — Місце Страти", min: 50, max: 54, tp: 20000 },
    { id: "l2dop_aden_05", name: "Aden — Вогняне Болото", min: 52, max: 58, tp: 22000 },
    { id: "l2dop_aden_06", name: "Aden — Темні Землі", min: 56, max: 62, tp: 24500 },
    { id: "l2dop_aden_07", name: "Aden — Підземелля", min: 58, max: 63, tp: 26500 },
    { id: "l2dop_aden_08", name: "Aden — Фортеця", min: 60, max: 65, tp: 28500 },
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
    { id: "l2dop_oren_01", name: "Орен — Околиці міста", min: 42, max: 46, tp: 16000 },
    { id: "l2dop_oren_02", name: "Орен — Темний ліс", min: 44, max: 48, tp: 17200 },
    { id: "l2dop_oren_03", name: "Орен — Море спор", min: 46, max: 50, tp: 18500 },
    { id: "l2dop_oren_04", name: "Орен — Околиці Круми", min: 48, max: 52, tp: 19800 },
    { id: "l2dop_oren_05", name: "Орен — Хрест зрадників", min: 50, max: 54, tp: 21200 },
    { id: "l2dop_oren_06", name: "Орен — Заборонені пагорби", min: 52, max: 56, tp: 22800 },
    { id: "l2dop_oren_07", name: "Орен — Руїни старого Орену", min: 54, max: 58, tp: 24400 },
    { id: "l2dop_oren_08", name: "Орен — Тінь Слонової вежі", min: 56, max: 60, tp: 26200 },
  ].map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_oren" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildOrenZoneMobs(z),
  })),
  ...[
    { id: "l2dop_goddard_01", name: "Годдарт — Гарячі джерела", min: 73, max: 75, tp: 32000 },
    { id: "l2dop_goddard_02", name: "Годдарт — Стежки джерел і Кетра", min: 74, max: 77, tp: 34000 },
    { id: "l2dop_goddard_03", name: "Годдарт — Землі Кетра", min: 75, max: 78, tp: 36000 },
    { id: "l2dop_goddard_04", name: "Годдарт — Кетра і Варка", min: 76, max: 79, tp: 38000 },
    { id: "l2dop_goddard_05", name: "Годдарт — Землі Варки", min: 77, max: 80, tp: 40000 },
    { id: "l2dop_goddard_06", name: "Годдарт — Монастир Св. Соліни", min: 78, max: 80, tp: 42000 },
    { id: "l2dop_goddard_07", name: "Годдарт — Вершини племен", min: 79, max: 80, tp: 44000 },
  ].map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_goddard" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildGoddardZoneMobs(z),
  })),
  ...buildL2DopSchuttgartZones(),
  ...buildL2DopRuneZones(),
  ...buildL2DopDionZones(),
  ...buildL2DopFloranVillageZones(),
  ...buildL2DopHeineZones(),
  ...buildL2DopHuntersVillageZones(),
  ...buildL2DopGludinVillageZones(),
  ...buildL2DopGoddardEliteZones(),
  ...buildL2DopAncientTombFieldsZones(),
];
