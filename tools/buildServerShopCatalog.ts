import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itemsDB, itemsDBWithStarter } from "../src/data/items/itemsDB";
import { resolveRegularShopItemsDBId } from "../src/data/shop/shopItemResolve";
import {
  NG_GRADE_SHOP_ITEMS,
} from "../src/data/shop/ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../src/data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../src/data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../src/data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../src/data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../src/data/shop/sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../src/data/shop/consumablesShop";
import { QUEST_SHOP_ITEMS } from "../src/data/shop/questShop";
import { QUEST_SHOP_ITEM_MAPPING } from "../src/data/shop/questShopResolvedMapping";
import type { ShopItem } from "../src/data/shop/shopTypes";

type CatalogEntry = {
  unitPrice: number;
  currency: "adena" | "coins_silver";
  stackable: boolean;
  itemMeta: {
    id: string;
    name: string;
    slot?: string;
    kind?: string;
    icon?: string;
    description?: string;
    grade?: string;
    armorType?: string;
  };
};

const EQUIP_KINDS = new Set([
  "weapon",
  "armor",
  "helmet",
  "boots",
  "gloves",
  "shield",
  "necklace",
  "ring",
  "earring",
  "jewelry",
  "belt",
  "cloak",
]);

function normalizeName(n: string): string {
  return n.toLowerCase().replace(/\[.*?\]/g, "").trim();
}

function findByName(name: string): string | null {
  const target = normalizeName(name || "");
  if (!target) return null;
  const keys = Object.keys(itemsDB).filter((k) => normalizeName(itemsDB[k]?.name || "") === target);
  if (keys.length === 1) return keys[0];
  return keys[0] ?? null;
}

function isStackableByMeta(def: any): boolean {
  const kind = String(def?.kind ?? "").toLowerCase();
  const slot = String(def?.slot ?? "").toLowerCase();
  if (EQUIP_KINDS.has(kind) || EQUIP_KINDS.has(slot) || slot === "weapon") return false;
  if (def?.stackable === false) return false;
  return true;
}

function resolveQuestItemsDbId(item: ShopItem): string | null {
  if (item.id && (itemsDB[item.id] || itemsDBWithStarter[item.id])) return item.id;
  const mapped = QUEST_SHOP_ITEM_MAPPING[item.itemId];
  if (mapped && (itemsDB[mapped] || itemsDBWithStarter[mapped])) return mapped;
  return findByName(item.name);
}

function toCatalogEntry(item: ShopItem, resolvedId: string, currency: "adena" | "coins_silver"): CatalogEntry | null {
  const def = itemsDB[resolvedId] || itemsDBWithStarter[resolvedId];
  if (!def) return null;
  return {
    unitPrice: Math.max(0, Number(item.price) || 0),
    currency,
    stackable: isStackableByMeta(def),
    itemMeta: {
      id: def.id,
      name: def.name,
      slot: def.slot,
      kind: def.kind,
      icon: def.icon,
      description: def.description,
      grade: def.grade,
      armorType: (def as any).armorType,
    },
  };
}

function main() {
  const regularCatalog: Record<string, CatalogEntry> = {};
  const questCatalog: Record<string, CatalogEntry> = {};
  const regularRows = [
    ...NG_GRADE_SHOP_ITEMS,
    ...D_GRADE_SHOP_ITEMS,
    ...C_GRADE_SHOP_ITEMS,
    ...B_GRADE_SHOP_ITEMS,
    ...A_GRADE_SHOP_ITEMS,
    ...S_GRADE_SHOP_ITEMS,
    ...CONSUMABLES_SHOP_ITEMS,
  ];

  for (const row of regularRows) {
    try {
      const id = resolveRegularShopItemsDBId(row);
      const entry = toCatalogEntry(row, id, "adena");
      if (entry) regularCatalog[id] = entry;
    } catch {
      // Skip unresolved rows; they will remain unavailable on server side.
    }
  }

  for (const row of QUEST_SHOP_ITEMS) {
    const id = resolveQuestItemsDbId(row);
    if (!id) continue;
    const entry = toCatalogEntry(row, id, "coins_silver");
    if (entry) questCatalog[id] = entry;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    regular: regularCatalog,
    quest: questCatalog,
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, "../server/src/data/shopCatalog.generated.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`[buildServerShopCatalog] wrote ${outPath}`);
  console.log(
    `[buildServerShopCatalog] regular=${Object.keys(regularCatalog).length}, quest=${Object.keys(questCatalog).length}`
  );
}

main();
