/**
 * Розділка риби на сервері — той самий пул екстра-луту, що й при зборі улову (rollFishingExtraDrops),
 * плюс скромна адена/шанс срібних монет за кожну рибу.
 */

import fishingDropItemMeta from "./data/fishingDropItemMeta.json";
import { rollFishingExtraDrops, type FishingExtraDropRow } from "./fishingCollectDrops";

export interface FishDropResult {
  adena: number;
  coinOfLuck: number;
  coinsSilver: number;
  weapons: Array<{ id: string; count: number }>;
  armorPieces: Array<{ id: string; count: number }>;
  jewelryPieces: Array<{ id: string; count: number }>;
  resources: Array<{ id: string; count: number }>;
  enchantScrolls: Array<{ id: string; count: number }>;
}

const META = fishingDropItemMeta as Record<string, { name: string; icon?: string; slot: string; kind?: string }>;

function aggPush(arr: Array<{ id: string; count: number }>, id: string, count: number) {
  const n = Math.max(1, Math.floor(count));
  const ex = arr.find((x) => x.id === id);
  if (ex) ex.count += n;
  else arr.push({ id, count: n });
}

function rowCategory(row: FishingExtraDropRow): "weapons" | "armorPieces" | "jewelryPieces" | "resources" {
  const slot = (row.slot || "").toLowerCase();
  const kind = (row.kind || "").toLowerCase();
  if (kind === "weapon") return "weapons";
  if (
    slot.includes("rear") ||
    slot.includes("lear") ||
    slot.includes("rfinger") ||
    slot.includes("lfinger") ||
    slot.includes("necklace")
  ) {
    return "jewelryPieces";
  }
  if (slot === "lrhand" || slot === "rhand") return "weapons";
  if (slot === "lhand" && kind === "weapon") return "weapons";
  if (
    kind === "armor" ||
    slot === "shield" ||
    slot.includes("helmet") ||
    slot === "chest" ||
    slot === "armor" ||
    slot.includes("gaiter") ||
    slot.includes("boot") ||
    slot.includes("glove") ||
    slot === "cloak" ||
    slot === "belt" ||
    slot === "underwear"
  ) {
    return "armorPieces";
  }
  return "resources";
}

export function processFishDrop(fishCount: number): FishDropResult {
  const n = Math.max(0, Math.floor(fishCount));
  const rows = rollFishingExtraDrops(n);
  const adenaPerFish = 100 + Math.floor(Math.random() * 400);
  const result: FishDropResult = {
    adena: n <= 0 ? 0 : adenaPerFish * n,
    coinOfLuck: 0,
    coinsSilver: 0,
    weapons: [],
    armorPieces: [],
    jewelryPieces: [],
    resources: [],
    enchantScrolls: [],
  };
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.015) result.coinsSilver += 1;
  }
  for (const row of rows) {
    const c = Math.max(1, row.count);
    switch (rowCategory(row)) {
      case "weapons":
        aggPush(result.weapons, row.id, c);
        break;
      case "armorPieces":
        aggPush(result.armorPieces, row.id, c);
        break;
      case "jewelryPieces":
        aggPush(result.jewelryPieces, row.id, c);
        break;
      default:
        aggPush(result.resources, row.id, c);
    }
  }
  return result;
}

export interface InventoryItemToAdd {
  id: string;
  name: string;
  type?: string;
  slot: string;
  icon?: string;
  count: number;
}

export function buildItemsFromDrop(result: FishDropResult): InventoryItemToAdd[] {
  const out: InventoryItemToAdd[] = [];
  const pushAll = (arr: Array<{ id: string; count: number }>) => {
    for (const { id, count } of arr) {
      const m = META[id];
      if (!m) continue;
      out.push({
        id,
        name: m.name,
        slot: m.slot || "resource",
        icon: m.icon,
        type: m.kind,
        count: Math.max(1, count),
      });
    }
  };
  pushAll(result.weapons);
  pushAll(result.armorPieces);
  pushAll(result.jewelryPieces);
  pushAll(result.resources);
  pushAll(result.enchantScrolls);
  return out;
}
