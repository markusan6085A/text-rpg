/**
 * Серверний аналог src/data/world/l2dop/tieredResourceLoot.ts
 * Чиста математика (Math.random, seed), без клієнтських імпортів.
 * Deterministic: buildDropEntries(level, seed) дає ті самі рядки, що й клієнт.
 */
import { STRING_ID_TO_L2_ITEM_ID } from "./droplistMapping";

export interface ServerDropEntry {
  id: string;
  kind: "adena" | "resource" | "equipment" | "other";
  chance: number;
  min: number;
  max: number;
  chancePerMillion?: number;
  displayName?: string;
}

const T1: readonly string[] = [
  "stem", "varnish", "suede", "animal_skin", "thread",
  "iron_ore", "coal", "charcoal", "animal_bone", "silver_nugget",
];
const T2: readonly string[] = [
  "oriharukon_ore", "stone_of_purity", "mithril_ore", "adamantite_nugget",
  "braided_hemp", "cokes", "steel", "coarse_bone_powder", "leather",
  "cord", "high_grade_suede", "compound_braid", "crafted_leather", "metallic_fiber",
];
const T3: readonly string[] = ["metal_hardener", "metallic_thread", "durable_metal_plate"];
const T4: readonly string[] = ["mold_glue", "mold_lubricant", "mold_hardener", "enria", "asofe", "thons"];

export const L2DOP_TIER_MATERIAL_IDS: ReadonlySet<string> = new Set<string>([
  ...T1, ...T2, ...T3, ...T4,
]);

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

const DROP_CPM_MIN = 40_000;
const DROP_CPM_MAX = 190_000;
const SPOIL_CHANCE_MULT_VS_DROP = 2;
const SPOIL_CPM_CAP = 400_000;

function rollDropCpm(rand: () => number): number {
  const span = DROP_CPM_MAX - DROP_CPM_MIN + 1;
  return DROP_CPM_MIN + Math.floor(rand() * span);
}

export function buildDropEntries(mobLevel: number, seed: string): ServerDropEntry[] {
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
    const cpm = rollDropCpm(rand);
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

export function spoilEntriesForMob(
  zoneId: string,
  mobLevel: number,
  seed: string,
  dropLines: ServerDropEntry[]
): ServerDropEntry[] {
  const ids = zoneSpoilResourceIds(zoneId, mobLevel);
  const rand = makeRng(hashSeed(seed + "|sp"));
  return ids.map((id) => {
    const tier = tierOfResource(id);
    const sameDrop = dropLines.find((d) => d.id === id && d.chancePerMillion != null && d.chancePerMillion > 0);
    const dropCpm = sameDrop?.chancePerMillion ?? rollDropCpm(rand);
    const cpm = Math.min(
      SPOIL_CPM_CAP,
      Math.max(DROP_CPM_MIN * SPOIL_CHANCE_MULT_VS_DROP, dropCpm * SPOIL_CHANCE_MULT_VS_DROP)
    );
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
 * Серверна версія applyL2dopTieredLootToMob.
 * Використовується для мобів l2dop_*, де drops/spoil обчислюються детерміновано.
 */
export function applyTieredLootToMob(
  mobId: string,
  mobLevel: number,
  zoneId: string,
  slotIndex = 0
): { drops: ServerDropEntry[]; spoil: ServerDropEntry[]; dropChance: number } {
  const L2DOP_NUMERIC_ID = /^l2dop_(\d+)/;
  if (!L2DOP_NUMERIC_ID.test(mobId)) {
    return { drops: [], spoil: [], dropChance: 0.7 };
  }

  const seed = `${zoneId}:${slotIndex}:${mobId}`;
  const drops = buildDropEntries(mobLevel, seed);
  const spoil = mobGetsSpoil(zoneId, mobId, slotIndex)
    ? spoilEntriesForMob(zoneId, mobLevel, seed, drops)
    : [];

  return { drops, spoil, dropChance: 1 };
}

/**
 * Generic tiered fallback for any mob id (not only l2dop_*).
 * Used when registry rows are missing or unexpectedly empty.
 */
export function applyTieredLootFallback(
  mobId: string,
  mobLevel: number,
  zoneId: string,
  slotIndex = 0
): { drops: ServerDropEntry[]; spoil: ServerDropEntry[]; dropChance: number } {
  const seed = `${zoneId}:${slotIndex}:${mobId}`;
  const drops = buildDropEntries(mobLevel, seed);
  const spoil = mobGetsSpoil(zoneId, mobId, slotIndex)
    ? spoilEntriesForMob(zoneId, mobLevel, seed, drops)
    : [];
  return { drops, spoil, dropChance: 1 };
}
