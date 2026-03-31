// Floran Village — 6 зон (id починається з floran* для дроп-профілів), 120–250 мобів, 2 чемпіони, 2–3 РБ; агро-патруль додає augmentPatrolMobs.

import type { Mob, Zone } from "../types";
import {
  fillZoneMobs,
  getFloranVillageL2DopChampions,
  getFloranVillageRaidBossesForZone,
  shuffleMobsRandomly,
  L2DOP_FLORAN_VILLAGE_POOL,
} from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

/**
 * Квестові моби перших проф Floran (світлий ельф-воїн/маг + темний ельф).
 * Завжди додаємо в 03/04: (1) fillZoneMobs інколи не обирає тип; (2) у _04 рівні зони 19–25, а частина мобів 15–18 —
 * без примусу вони ніколи не потрапляють у список, хоча квест описує обидві зони.
 */
const FLORAN_FIRST_PROF_QUEST_MOB_NAMES: readonly string[] = [
  "Venomous Spider",
  "Lirein",
  "Tracker Skeleton Leader",
  "Boogle Ratman Leader",
  "Lesser Dark Horror",
  "Shade Horror",
  "Crypt Horror",
  "Oblivion Watcher",
  "Will-O-Wisp",
  "Mana Seeker",
  "Scarlet Salamander",
  "Undine",
];

function injectFloranFirstProfQuestMobs(regular: Mob[], zoneId: string): Mob[] {
  if (zoneId !== "floran_village_03" && zoneId !== "floran_village_04") return regular;
  const namesPresent = new Set(regular.map((m) => m.name));
  const injected: Mob[] = [];
  for (const name of FLORAN_FIRST_PROF_QUEST_MOB_NAMES) {
    if (namesPresent.has(name)) continue;
    const template = L2DOP_FLORAN_VILLAGE_POOL.find((m) => m.name === name);
    if (!template) continue;
    injected.push({ ...template });
    namesPresent.add(name);
  }
  return injected.length > 0 ? [...injected, ...regular] : regular;
}

function buildFloranVillageZoneMobs(z: { id: string; min: number; max: number }) {
  const filled = fillZoneMobs(L2DOP_FLORAN_VILLAGE_POOL, z.id, z.min, z.max, 120, 250, 6, 16);
  const regularWithQuest = injectFloranFirstProfQuestMobs(filled, z.id);
  const regular = regularWithQuest.map((m, i) => applyL2XmlDropsToMob(m, z.id, i));
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
