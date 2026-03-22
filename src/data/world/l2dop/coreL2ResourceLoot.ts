// src/data/world/l2dop/coreL2ResourceLoot.ts
// Єдиний пул з 20 основних L2-ресурсів (id з newstats/items XML) для дропу та спойлу на всіх мобах.
import type { DropEntry } from "../../combat/types";
import { l2ItemIdToString } from "./droplistMapping";

/**
 * true: ігноруємо Floran-профіль, XML-droplist на мобі, treasure box — лише цей пул.
 * false: попередня логіка (Floran + mob.drops + XML через applyL2XmlDropsToMob).
 */
export const USE_CORE_RESOURCE_LOOT_ONLY = true;

/** Назви як у XML item name (Interlude), id — рядок з droplistMapping */
type CoreRow = {
  l2ItemId: number;
  /** шанс дропу з тіла моба, 1_000_000 = 100% на рядок (незалежний roll) */
  dropCpm: number;
  /** спойл: вищі шанси; для рідких руд — сильно вище за drop */
  spoilCpm: number;
};

const CORE_TABLE: CoreRow[] = [
  // База (часті з kill, спойл щедрий)
  { l2ItemId: 1864, dropCpm: 24_000, spoilCpm: 92_000 },
  { l2ItemId: 1865, dropCpm: 22_000, spoilCpm: 88_000 },
  { l2ItemId: 1866, dropCpm: 23_000, spoilCpm: 90_000 },
  { l2ItemId: 1867, dropCpm: 21_000, spoilCpm: 86_000 },
  { l2ItemId: 1868, dropCpm: 24_000, spoilCpm: 91_000 },
  { l2ItemId: 1870, dropCpm: 20_000, spoilCpm: 84_000 },
  { l2ItemId: 1871, dropCpm: 19_000, spoilCpm: 82_000 },
  { l2ItemId: 1872, dropCpm: 21_000, spoilCpm: 87_000 },
  // Руди / слитки середньої ваги
  { l2ItemId: 1869, dropCpm: 15_000, spoilCpm: 70_000 },
  { l2ItemId: 1873, dropCpm: 13_000, spoilCpm: 65_000 },
  // Рідкіші матеріали крафту
  { l2ItemId: 1875, dropCpm: 9_000, spoilCpm: 48_000 },
  { l2ItemId: 1876, dropCpm: 8_000, spoilCpm: 44_000 },
  { l2ItemId: 1877, dropCpm: 7_000, spoilCpm: 42_000 },
  // Дуже рідка руда — з тіла майже не падає, зі спойлу помітно частіше
  { l2ItemId: 1874, dropCpm: 2_200, spoilCpm: 38_000 },
  // Молди / реагенти B-grade крафту
  { l2ItemId: 4039, dropCpm: 5_500, spoilCpm: 40_000 },
  { l2ItemId: 4040, dropCpm: 5_000, spoilCpm: 38_000 },
  { l2ItemId: 4041, dropCpm: 4_800, spoilCpm: 36_000 },
  { l2ItemId: 4042, dropCpm: 4_500, spoilCpm: 35_000 },
  { l2ItemId: 4043, dropCpm: 4_500, spoilCpm: 35_000 },
  { l2ItemId: 4044, dropCpm: 4_200, spoilCpm: 34_000 },
];

const DISPLAY_NAME: Record<number, string> = {
  1864: "Stem",
  1865: "Varnish",
  1866: "Suede",
  1867: "Animal Skin",
  1868: "Thread",
  1869: "Iron Ore",
  1870: "Coal",
  1871: "Charcoal",
  1872: "Animal Bone",
  1873: "Silver Nugget",
  1874: "Oriharukon Ore",
  1875: "Stone of Purity",
  1876: "Mithril Ore",
  1877: "Adamantite Nugget",
  4039: "Mold Glue",
  4040: "Mold Lubricant",
  4041: "Mold Hardener",
  4042: "Enria",
  4043: "Asofe",
  4044: "Thons",
};

function rowToDropEntry(row: CoreRow, cpm: number): DropEntry {
  const id = l2ItemIdToString(row.l2ItemId);
  if (!id) {
    throw new Error(`coreL2ResourceLoot: no string id for L2 item ${row.l2ItemId}`);
  }
  return {
    id,
    kind: "resource",
    chance: 0,
    min: 1,
    max: 1,
    chancePerMillion: Math.min(1_000_000, Math.max(0, Math.floor(cpm))),
    l2ItemId: row.l2ItemId,
    displayName: DISPLAY_NAME[row.l2ItemId] ?? id,
  };
}

export function getCoreResourceDrops(): DropEntry[] {
  return CORE_TABLE.map((r) => rowToDropEntry(r, r.dropCpm));
}

export function getCoreResourceSpoil(): DropEntry[] {
  return CORE_TABLE.map((r) => rowToDropEntry(r, r.spoilCpm));
}

export function findCoreLootLineForItemId(itemId: string): DropEntry | undefined {
  return (
    getCoreResourceDrops().find((d) => d.id === itemId) ??
    getCoreResourceSpoil().find((s) => s.id === itemId)
  );
}
