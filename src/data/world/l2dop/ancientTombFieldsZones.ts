/**
 * Ancient Tomb Fields — 10 околиць, рівні 1–80 сумарно.
 * Пул мобів: існуючі l2dop NPC з Gludio / Dion / Giran / Aden / Oren / Goddard (без вигаданих імен).
 * Дроп Ancient Adena — лише тут; іконка etc_ancient_adena_i00.png (itemsDB ancient_adena).
 */
import type { Zone, Mob } from "../types";
import type { RaidBoss } from "../../bosses/floran_overlord";
import type { DropEntry } from "../../combat/types";
import {
  fillZoneMobs,
  shuffleMobsRandomly,
  makeChampion,
  L2DOP_GLUDIO_POOL,
  L2DOP_ADEN_POOL,
  L2DOP_OREN_POOL,
} from "./mobs";
import { L2DOP_DION_POOL } from "./dionMobs.generated";
import { L2DOP_GIRAN_POOL } from "./giranMobs.generated";
import { L2DOP_GODDARD_POOL } from "./goddardMobs.generated";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function mergeMobPoolsUnique(pools: Mob[][]): Mob[] {
  const seen = new Set<string>();
  const out: Mob[] = [];
  for (const pool of pools) {
    for (const m of pool) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

/** Повний пул для фільтрації за рівнем зони */
export const ANCIENT_TOMB_FIELDS_MOB_POOL: Mob[] = mergeMobPoolsUnique([
  L2DOP_GLUDIO_POOL,
  L2DOP_DION_POOL,
  L2DOP_GIRAN_POOL,
  L2DOP_ADEN_POOL,
  L2DOP_OREN_POOL,
  L2DOP_GODDARD_POOL,
]);

/** Шанс 14%…38%, кількість min/max зростають від 1 до 80 рівня (до 1685 max). */
function ancientTombAncientAdenaEntry(mobLevel: number): DropEntry {
  const lvl = Math.max(1, Math.min(80, Math.floor(mobLevel)));
  const t = (lvl - 1) / 79;
  const chance = 0.14 + t * (0.38 - 0.14);
  const min = Math.max(1, Math.round(14 + t * (380 - 14)));
  const max = Math.max(min, Math.round(40 + t * (1685 - 40)));
  return { id: "ancient_adena", kind: "resource", chance, min, max };
}

function injectAncientTombAncientAdena<T extends Mob>(mob: T): T {
  if ((mob as { isRaidBoss?: boolean }).isRaidBoss) return mob;
  const extra = ancientTombAncientAdenaEntry(mob.level);
  const drops = [...(mob.drops ?? []), extra];
  return { ...mob, drops };
}

const TOMB_CHAMPION_BASE_NAMES: Record<string, string> = {
  "01": "Verge Watcher",
  "02": "Boneyard Warden",
  "03": "Sepulcher Hunter",
  "04": "Crypt Stalker",
  "05": "Barrow Knight",
  "06": "Catacomb Warlord",
  "07": "Tomb Reaver",
  "08": "Gravebound Tyrant",
  "09": "Ossuary Archon",
  "10": "Thronebound Ancient",
};

function getAncientTombFieldsChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = ANCIENT_TOMB_FIELDS_MOB_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => {
    h = (h * 1664525 + 1013904223) | 0;
    return (h >>> 0) / 0xffffffff;
  };
  const count = 3 + Math.floor(rand() * 5);
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const suffixes = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const zoneNum = zoneId.replace("ancient_tomb_fields_", "");
  const baseName = TOMB_CHAMPION_BASE_NAMES[zoneNum] ?? "Tomb Champion";
  const result: Mob[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    result.push(
      makeChampion(shuffled[i]!, `${baseName} ${suffixes[i % suffixes.length] ?? i}`, String.fromCharCode(97 + i), zoneId)
    );
  }
  return result;
}

function buildAncientTombFieldsZoneMobs(z: { id: string; min: number; max: number }): (Mob | RaidBoss)[] {
  const regular = fillZoneMobs(ANCIENT_TOMB_FIELDS_MOB_POOL, z.id, z.min, z.max, 150, 300, 10, 22).map((m, i) =>
    injectAncientTombAncientAdena(applyL2XmlDropsToMob(m, z.id, i))
  );
  const champions = getAncientTombFieldsChampions(z.id, z.min, z.max).map((m, i) =>
    injectAncientTombAncientAdena(applyL2XmlDropsToMob(m, z.id, 2000 + i))
  );
  const raidBosses: RaidBoss[] = [];
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const ANCIENT_TOMB_ZONE_ROWS = [
  { id: "ancient_tomb_fields_01", name: "Ancient Tomb Fields — Dust Threshold", min: 1, max: 8, tp: 32_000 },
  { id: "ancient_tomb_fields_02", name: "Ancient Tomb Fields — Ash Hollow", min: 9, max: 16, tp: 34_500 },
  { id: "ancient_tomb_fields_03", name: "Ancient Tomb Fields — Rune Walk", min: 17, max: 24, tp: 37_000 },
  { id: "ancient_tomb_fields_04", name: "Ancient Tomb Fields — Gravel March", min: 25, max: 32, tp: 39_500 },
  { id: "ancient_tomb_fields_05", name: "Ancient Tomb Fields — Bone Flats", min: 33, max: 40, tp: 42_000 },
  { id: "ancient_tomb_fields_06", name: "Ancient Tomb Fields — Fossil Ridge", min: 41, max: 48, tp: 44_500 },
  { id: "ancient_tomb_fields_07", name: "Ancient Tomb Fields — Marrow Vale", min: 49, max: 56, tp: 47_000 },
  { id: "ancient_tomb_fields_08", name: "Ancient Tomb Fields — Cairn Depths", min: 57, max: 64, tp: 49_500 },
  { id: "ancient_tomb_fields_09", name: "Ancient Tomb Fields — Kingsfell Expanse", min: 65, max: 72, tp: 52_000 },
  { id: "ancient_tomb_fields_10", name: "Ancient Tomb Fields — Thronebarrow Edge", min: 73, max: 80, tp: 54_500 },
] as const;

export function buildL2DopAncientTombFieldsZones(): Zone[] {
  return ANCIENT_TOMB_ZONE_ROWS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "ancient_tomb_fields",
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildAncientTombFieldsZoneMobs(z) as Mob[],
  }));
}
