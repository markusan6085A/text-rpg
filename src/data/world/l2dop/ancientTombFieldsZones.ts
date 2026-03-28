/**
 * Ancient Tomb Fields — 10 околиць, рівні 1–80 сумарно.
 * Пул мобів: існуючі l2dop NPC (Gludio, Dion, Giran, Aden, Oren, Goddard, Schuttgart, Rune).
 * Дроп Ancient Adena — лише тут (+ бонус ~10% на додаткову порцію AA). Рейд-боси — з підсиленим AA.
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
  L2DOP_SCHUTTGART_POOL,
  L2DOP_RUNE_POOL,
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
  L2DOP_SCHUTTGART_POOL,
  L2DOP_RUNE_POOL,
]);

/** Основний AA: шанс 14%…38%, кіл-ть до ~1685 на високих рівнях. */
function ancientTombAncientAdenaMainEntry(mobLevel: number): DropEntry {
  const lvl = Math.max(1, Math.min(80, Math.floor(mobLevel)));
  const t = (lvl - 1) / 79;
  const chance = 0.14 + t * (0.38 - 0.14);
  const min = Math.max(1, Math.round(14 + t * (380 - 14)));
  const max = Math.max(min, Math.round(40 + t * (1685 - 40)));
  return { id: "ancient_adena", kind: "resource", chance, min, max };
}

/** Додатковий AA з шансом 10% (друга незалежна «порція»). */
function ancientTombAncientAdenaBonusEntry(mobLevel: number): DropEntry {
  const lvl = Math.max(1, Math.min(80, Math.floor(mobLevel)));
  const t = (lvl - 1) / 79;
  const min = Math.max(1, Math.round(7 + t * (95 - 7)));
  const max = Math.max(min, Math.round(18 + t * (320 - 18)));
  return { id: "ancient_adena", kind: "resource", chance: 0.1, min, max };
}

function injectAncientTombAncientAdena<T extends Mob>(mob: T): T {
  if ((mob as { isRaidBoss?: boolean }).isRaidBoss) return mob;
  const main = ancientTombAncientAdenaMainEntry(mob.level);
  const bonus = ancientTombAncientAdenaBonusEntry(mob.level);
  const drops = [...(mob.drops ?? []), main, bonus];
  return { ...mob, drops };
}

function cloneTombRaidBoss(base: RaidBoss, suffix: string, nameSuffix: string): RaidBoss {
  const mul = 0.9 + (suffix.charCodeAt(0) % 5) * 0.05;
  return {
    ...base,
    id: `${base.id}_${suffix}`,
    name: `Raid Boss: ${nameSuffix}`,
    hp: Math.round(base.hp * mul),
    pAtk: Math.round(base.pAtk * mul),
    mAtk: Math.round((base.mAtk ?? 0) * mul),
    pDef: Math.round(base.pDef * mul),
    mDef: Math.round(base.mDef * mul),
    exp: Math.round(base.exp * mul),
    sp: Math.round((base.sp ?? 0) * mul),
    adenaMin: Math.round(base.adenaMin * mul),
    adenaMax: Math.round(base.adenaMax * mul),
  };
}

function tombRbDrops(_rbIndex: number): DropEntry[] {
  return [];
}

/** Рейди: два рядки AA (основний високий шанс + додатковий). */
function tombRaidBossAaDrops(level: number): DropEntry[] {
  const lvl = Math.max(1, Math.min(80, Math.floor(level)));
  const t = (lvl - 1) / 79;
  const mainChance = 0.62 + t * 0.14;
  const min = Math.round(220 + t * (1500 - 220));
  const max = Math.round(700 + t * (5500 - 700));
  const bonusChance = 0.2 + t * 0.1;
  const bmin = Math.round(80 + t * (500 - 80));
  const bmax = Math.round(220 + t * (1800 - 220));
  return [
    { id: "ancient_adena", kind: "resource", chance: mainChance, min, max },
    { id: "ancient_adena", kind: "resource", chance: bonusChance, min: bmin, max: Math.max(bmin, bmax) },
  ];
}

function attachTombRaidLoot(base: RaidBoss, rbIndex: number): RaidBoss {
  return {
    ...base,
    drops: [...tombRbDrops(rbIndex), ...tombRaidBossAaDrops(base.level)],
  };
}

const TOMB_RB_BASE: RaidBoss[] = [
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_01",
      name: "Grave Mound Warden",
      level: 8,
      hp: 16_000,
      mp: 0,
      pAtk: 125,
      mAtk: 0,
      pDef: 98,
      mDef: 66,
      exp: 15_500,
      sp: 820,
      adenaMin: 4200,
      adenaMax: 7200,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 4 * 60 * 60,
      dropProfileId: "rb_l2dop_gludio_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_01",
    },
    0
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_02",
      name: "Ash Crypt Sentinel",
      level: 16,
      hp: 42_000,
      mp: 0,
      pAtk: 205,
      mAtk: 0,
      pDef: 158,
      mDef: 108,
      exp: 38_000,
      sp: 1950,
      adenaMin: 10_000,
      adenaMax: 16_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 4 * 60 * 60,
      dropProfileId: "rb_l2dop_gludio_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_02",
    },
    1
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_03",
      name: "Rune-Etched Revenant",
      level: 24,
      hp: 82_000,
      mp: 0,
      pAtk: 295,
      mAtk: 110,
      pDef: 228,
      mDef: 165,
      exp: 72_000,
      sp: 3600,
      adenaMin: 20_000,
      adenaMax: 32_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 5 * 60 * 60,
      dropProfileId: "rb_l2dop_gludio_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_03",
    },
    2
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_04",
      name: "Gravel Titan",
      level: 32,
      hp: 125_000,
      mp: 0,
      pAtk: 385,
      mAtk: 0,
      pDef: 298,
      mDef: 205,
      exp: 115_000,
      sp: 5600,
      adenaMin: 32_000,
      adenaMax: 50_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 5 * 60 * 60,
      dropProfileId: "rb_l2dop_gludio_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_04",
    },
    3
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_05",
      name: "Bone Flats Warlord",
      level: 40,
      hp: 185_000,
      mp: 0,
      pAtk: 495,
      mAtk: 0,
      pDef: 375,
      mDef: 258,
      exp: 178_000,
      sp: 8500,
      adenaMin: 48_000,
      adenaMax: 74_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 5 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_05",
    },
    4
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_06",
      name: "Fossil Ridge Tyrant",
      level: 48,
      hp: 265_000,
      mp: 0,
      pAtk: 595,
      mAtk: 0,
      pDef: 448,
      mDef: 305,
      exp: 248_000,
      sp: 12_000,
      adenaMin: 68_000,
      adenaMax: 104_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 6 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_06",
    },
    5
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_07",
      name: "Marrow Vale Lich",
      level: 56,
      hp: 360_000,
      mp: 1200,
      pAtk: 320,
      mAtk: 455,
      pDef: 465,
      mDef: 385,
      exp: 335_000,
      sp: 16_500,
      adenaMin: 92_000,
      adenaMax: 142_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 6 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_07",
    },
    6
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_08",
      name: "Cairn Depths Behemoth",
      level: 64,
      hp: 475_000,
      mp: 0,
      pAtk: 780,
      mAtk: 0,
      pDef: 565,
      mDef: 385,
      exp: 445_000,
      sp: 22_000,
      adenaMin: 122_000,
      adenaMax: 188_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 6 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_08",
    },
    7
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_09",
      name: "Kingsfell Ancient",
      level: 72,
      hp: 605_000,
      mp: 0,
      pAtk: 920,
      mAtk: 0,
      pDef: 655,
      mDef: 445,
      exp: 575_000,
      sp: 28_500,
      adenaMin: 158_000,
      adenaMax: 242_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 7 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_09",
    },
    8
  ),
  attachTombRaidLoot(
    {
      id: "rb_ancient_tomb_fields_10",
      name: "Thronebarrow Sovereign",
      level: 80,
      hp: 735_000,
      mp: 0,
      pAtk: 1080,
      mAtk: 0,
      pDef: 755,
      mDef: 515,
      exp: 715_000,
      sp: 35_000,
      adenaMin: 198_000,
      adenaMax: 305_000,
      dropChance: 1,
      drops: [],
      isRaidBoss: true,
      respawnTime: 7 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId: "ancient_tomb_fields_10",
    },
    9
  ),
];

const TOMB_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Dust Reaper", "Threshold Keeper", "Bleached Stalker", "Low Barrow Lord", "Verge Horror"],
  "02": ["Ash Herald", "Hollow Mourner", "Cinder Knight", "Char Wraith", "Ember Judge"],
  "03": ["Runebound Shade", "Glyph Walker", "Stone Scriptor", "Pale Oracle", "Mark of Doom"],
  "04": ["March Breaker", "Gravel King", "Shattered Colossus", "Pebble Titan", "Crag Arbiter"],
  "05": ["Bone Emperor", "Flatlands Reaper", "Marrow Count", "Skull Consul", "Ribcage Beast"],
  "06": ["Fossil Archon", "Petrified Duke", "Ridge Horror", "Strata Lord", "Amber Sentinel"],
  "07": ["Vale Widow", "Blood Mire Witch", "Marrow Twins", "Depth Choir", "Pit Hierophant"],
  "08": ["Cairn Mother", "Depth King", "Underbarrow Eye", "Stone Wraith", "Barrow Heart"],
  "09": ["Fallen Crown", "Regicide Spirit", "Kingsblood", "Fell Standard", "Exile King"],
  "10": ["Last Throne Warden", "Crownbound Horror", "Dynasty Shade", "Dead King", "Barrow Emperor"],
};

function getAncientTombRaidBossesForZone(zoneId: string): RaidBoss[] {
  const base = TOMB_RB_BASE.find((rb) => rb.zoneId === zoneId);
  if (!base) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => {
    h = (h * 1664525 + 1013904223) | 0;
    return (h >>> 0) / 0xffffffff;
  };
  const zoneNum = zoneId.replace("ancient_tomb_fields_", "");
  const extraNames = TOMB_RB_EXTRA_NAMES[zoneNum] ?? [];
  const clones = extraNames.map((n, i) => cloneTombRaidBoss(base, String.fromCharCode(98 + i), n));
  const withLoot = clones.map((rb, i) => ({
    ...rb,
    drops: [...tombRaidBossAaDrops(rb.level)],
  }));
  const all: RaidBoss[] = [base, ...withLoot];
  const takeCount = 3 + Math.floor(rand() * 4);
  return [...all].sort(() => rand() - 0.5).slice(0, Math.min(takeCount, all.length));
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
  const raidBosses = getAncientTombRaidBossesForZone(z.id);
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
