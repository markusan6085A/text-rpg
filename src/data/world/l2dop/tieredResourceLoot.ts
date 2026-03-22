// Тиерні ресурсні дроп/спойл для l2dop_* мобів (без XML droplist у даних моба).
// Дроп: 3–6 видів, chancePerMillion; спойл: 1–3 види на зону (детерміновано від zoneId), ~42% мобів.

import type { Mob } from "../types";
import type { DropEntry } from "../../combat/types";
import { STRING_ID_TO_L2_ITEM_ID } from "./droplistMapping";

const L2DOP_NUMERIC_ID = /^l2dop_(\d+)/;

export function l2NpcTemplateIdFromMobId(mobId: string): number | undefined {
  const m = L2DOP_NUMERIC_ID.exec(mobId);
  return m ? parseInt(m[1], 10) : undefined;
}

/** NG / низькі рівні */
const T1: readonly string[] = [
  "stem",
  "varnish",
  "suede",
  "animal_skin",
  "thread",
  "iron_ore",
  "coal",
  "charcoal",
  "animal_bone",
  "silver_nugget",
];

/** Середні матеріали */
const T2: readonly string[] = [
  "oriharukon_ore",
  "stone_of_purity",
  "mithril_ore",
  "adamantite_nugget",
  "braided_hemp",
  "cokes",
  "steel",
  "coarse_bone_powder",
  "leather",
  "cord",
  "high_grade_suede",
  "compound_braid",
  "crafted_leather",
  "metallic_fiber",
];

/** Перед топом: пластини, нитки */
const T3: readonly string[] = ["metal_hardener", "metallic_thread", "durable_metal_plate"];

/** Топ рецептурні */
const T4: readonly string[] = ["mold_glue", "mold_lubricant", "mold_hardener", "enria", "asofe", "thons"];

function levelBracket(level: number): 1 | 2 | 3 | 4 {
  if (level <= 20) return 1;
  if (level <= 40) return 2;
  if (level <= 55) return 3;
  return 4;
}

function dropPoolForBracket(b: 1 | 2 | 3 | 4): string[] {
  if (b === 1) return [...T1];
  if (b === 2) return [...T1, ...T2];
  if (b === 3) return [...T2, ...T3];
  return [...T3, ...T4];
}

/** Пул для спойлу — трохи «вище» за звичайний дроп */
function spoilPoolForBracket(b: 1 | 2 | 3 | 4): string[] {
  if (b === 1) return [...T1];
  if (b === 2) return [...T1, ...T2];
  if (b === 3) return [...T2, ...T3];
  return [...T3, ...T4];
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let h = seed;
  return () => {
    h = (h * 1664525 + 1013904223) | 0;
    return (h >>> 0) / 0xffffffff;
  };
}

function tierOfResource(id: string): 1 | 2 | 3 | 4 {
  if ((T4 as readonly string[]).includes(id)) return 4;
  if ((T3 as readonly string[]).includes(id)) return 3;
  if ((T2 as readonly string[]).includes(id)) return 2;
  return 1;
}

function baseChancePerMillion(bracket: 1 | 2 | 3 | 4, tier: 1 | 2 | 3 | 4): number {
  const tierBonus = (tier - 1) * 4500;
  if (bracket === 1) return 15000 + tierBonus;
  if (bracket === 2) return 19000 + tierBonus;
  if (bracket === 3) return 24000 + tierBonus;
  return 30000 + tierBonus;
}

function buildDropEntries(
  mobLevel: number,
  seed: string
): DropEntry[] {
  const bracket = levelBracket(mobLevel);
  const pool = dropPoolForBracket(bracket);
  const rand = makeRng(hashSeed(seed));
  const count = 3 + Math.floor(rand() * 4);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const picked: string[] = [];
  for (const id of shuffled) {
    if (picked.includes(id)) continue;
    picked.push(id);
    if (picked.length >= count) break;
  }
  while (picked.length < 3 && pool.length > 0) {
    const id = pool[picked.length % pool.length]!;
    if (!picked.includes(id)) picked.push(id);
    else break;
  }

  return picked.map((id) => {
    const tier = tierOfResource(id);
    let cpm = baseChancePerMillion(bracket, tier);
    if (tier >= 3) cpm += 6000;
    if (tier >= 4) cpm += 5000;
    cpm = Math.min(520_000, Math.max(8000, Math.round(cpm * (0.92 + rand() * 0.16))));
    const l2 = STRING_ID_TO_L2_ITEM_ID[id];
    const qtyRoll = rand();
    const maxQty = tier >= 3 ? (qtyRoll < 0.65 ? 2 : 3) : qtyRoll < 0.55 ? 2 : 3;
    const minQty = tier >= 4 && rand() < 0.35 ? 1 : 1;
    return {
      id,
      kind: "resource" as const,
      chance: 0,
      min: minQty,
      max: Math.max(minQty, maxQty),
      chancePerMillion: cpm,
      ...(l2 !== undefined ? { l2ItemId: l2 } : {}),
    };
  });
}

function zoneSpoilResourceIds(zoneId: string, mobLevel: number): string[] {
  const bracket = levelBracket(mobLevel);
  const pool = spoilPoolForBracket(bracket);
  const rand = makeRng(hashSeed(`${zoneId}|spoil`));
  const n = 1 + Math.floor(rand() * 3);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const out: string[] = [];
  for (const id of shuffled) {
    if (out.includes(id)) continue;
    out.push(id);
    if (out.length >= n) break;
  }
  if (out.length === 0 && pool[0]) out.push(pool[0]);
  return out;
}

function spoilEntriesForMob(zoneId: string, mobLevel: number, seed: string): DropEntry[] {
  const ids = zoneSpoilResourceIds(zoneId, mobLevel);
  const bracket = levelBracket(mobLevel);
  const rand = makeRng(hashSeed(seed + "|sp"));
  return ids.map((id) => {
    const tier = tierOfResource(id);
    let cpm = Math.round(baseChancePerMillion(bracket, tier) * 0.82);
    if (tier >= 3) cpm += 5500;
    if (tier >= 4) cpm += 6000;
    cpm = Math.min(480_000, Math.max(7000, Math.round(cpm * (0.9 + rand() * 0.2))));
    const l2 = STRING_ID_TO_L2_ITEM_ID[id];
    return {
      id,
      kind: "resource" as const,
      chance: 0,
      min: 1,
      max: tier >= 4 ? (rand() < 0.4 ? 2 : 1) : rand() < 0.5 ? 2 : 1,
      chancePerMillion: cpm,
      ...(l2 !== undefined ? { l2ItemId: l2 } : {}),
    };
  });
}

function mobGetsSpoil(zoneId: string, mobId: string, slotIndex: number): boolean {
  const h = hashSeed(`${zoneId}:${mobId}:${slotIndex}:spoilgate`);
  return h % 100 < 42;
}

/**
 * Застосувати тиерний дроп/спойл до l2dop-моба. Рейд-босів та нел2dop не змінює.
 */
export function applyL2dopTieredLootToMob<T extends Mob>(mob: T, zoneId: string, slotIndex = 0): T {
  if ((mob as { isRaidBoss?: boolean }).isRaidBoss === true) return mob;
  if (mob.id.includes("_champion_")) return mob;
  if (l2NpcTemplateIdFromMobId(mob.id) === undefined) return mob;

  const seed = `${zoneId}:${slotIndex}:${mob.id}`;
  const drops = buildDropEntries(mob.level, seed);
  const spoil = mobGetsSpoil(zoneId, mob.id, slotIndex) ? spoilEntriesForMob(zoneId, mob.level, seed) : [];

  return {
    ...mob,
    dropChance: 1,
    drops,
    spoil: spoil.length ? spoil : [],
  };
}
