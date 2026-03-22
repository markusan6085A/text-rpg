/**
 * Маппінг L2 item_id (з droplist l2dop) → string id (itemsDB text-rpg)
 * Використовується для конвертації дропу/спойлу з lineage.sql droplist.
 *
 * Джерело: lineage.sql items table (item_id, name)
 * Тільки ресурси та матеріали — броня/біжутерія не включені.
 */

export const DROPLIST_ITEM_ID_TO_STRING: Record<number, string> = {
  // Adena (окрема логіка — ми використовуємо свою)
  57: "adena",

  // Базові ресурси (NG, 1–20 лвл)
  1864: "stem",
  1865: "varnish",
  1866: "suede",
  1867: "animal_skin",
  1868: "thread",
  1869: "iron_ore",
  1870: "coal",
  1871: "charcoal",
  1872: "animal_bone",

  // Середні ресурси
  1873: "silver_nugget",
  1874: "oriharukon_ore",
  1875: "stone_of_purity",
  1876: "mithril_ore",
  1877: "adamantite_nugget",
  1878: "braided_hemp",
  1879: "cokes",
  1880: "steel",
  1881: "coarse_bone_powder",
  1882: "leather",
  1884: "cord",
  1885: "high_grade_suede",
  1889: "compound_braid",
  1894: "crafted_leather",
  1895: "metallic_fiber",

  // Високі ресурси (B-grade+)
  5220: "metal_hardener",
  5549: "metallic_thread",
  5550: "durable_metal_plate",
  4039: "mold_glue",
  4040: "mold_lubricant",
  4041: "mold_hardener",
  4042: "enria",
  4043: "asofe",
  4044: "thons",
};

/** Зворотний маппінг: string id → L2 item_id (для експорту/дебагу) */
export const STRING_ID_TO_L2_ITEM_ID: Record<string, number> = Object.fromEntries(
  Object.entries(DROPLIST_ITEM_ID_TO_STRING).map(([k, v]) => [v, Number(k)])
);

/** Конвертує L2 item_id в string id. Повертає undefined якщо немає маппінгу */
export function l2ItemIdToString(itemId: number): string | undefined {
  return DROPLIST_ITEM_ID_TO_STRING[itemId];
}

/** Іконка `l2drop-by-itemid/{L2 id}.jpg` (основна папка; l2dop — fallback у handleResourceIconError). */
export function getL2dopResourceIconPath(stringId: string): string | undefined {
  const l2 = STRING_ID_TO_L2_ITEM_ID[stringId];
  if (l2 === undefined) return undefined;
  return `/items/drops/resources/l2drop-by-itemid/${l2}.jpg`;
}

const RECIPE_NAME_RE = /^Recipe\s*:/i;

/** Рецепти (L2 EtcItem, назва з «Recipe:») — окрема папка іконок у public */
export function isL2RecipeDrop(entry: { kind: string; displayName?: string }): boolean {
  if (entry.kind === "other") return true;
  const n = entry.displayName?.trim() ?? "";
  return RECIPE_NAME_RE.test(n);
}

/**
 * Іконка для синтетичного дропу l2item_*: ресурси → resources/…, рецепти → recipes/…
 * `public/items/drops/{resources|recipes}/l2drop-by-itemid/{l2ItemId}.jpg`
 */
export function getL2DropEntryByItemIdPath(entry: {
  kind: string;
  displayName?: string;
  l2ItemId?: number;
}): string | undefined {
  if (entry.l2ItemId == null) return undefined;
  const sub = isL2RecipeDrop(entry) ? "recipes" : "resources";
  return `/items/drops/${sub}/l2drop-by-itemid/${entry.l2ItemId}.jpg`;
}
