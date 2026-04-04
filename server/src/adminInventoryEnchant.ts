/** Макс. заточка для рядка інвентаря (узгоджено з клієнтом handleEnchantScroll): зброя +40, броня/біжутерія +30 */

const ARMOR_KINDS = new Set(
  "armor,helmet,boots,gloves,shield,necklace,ring,earring,jewelry,belt,cloak".split(",")
);
const ARMOR_SLOTS = new Set("necklace,ring,earring,jewelry,belt,cloak".split(","));

const DISALLOWED_ENCHANT_IDS = new Set(
  ["adena", "coin_of_luck", "coins_silver", "ancient_adena", "tvt_coin", "overflow_chest"].map((s) =>
    s.toLowerCase()
  )
);

/**
 * У БД у рядку інвентаря часто лише id/count без kind/type — тоді сервер не мав би повертати 0.
 * Узгоджено з клієнтом: quest_weapon_/shop_weapon_*, міграції s_draconic_bow / s_angel_slayer.
 */
function inferMaxEnchantFromItemId(rawId: string): number {
  const id = rawId.toLowerCase();
  if (!id) return 0;
  if (id.includes("_weapon_") || id.startsWith("weapon_")) return 40;
  if (id === "s_draconic_bow" || id === "s_angel_slayer") return 40;
  return 0;
}

export function maxEnchantForInventoryRow(row: any): number {
  const rawId = String(row?.id ?? row?.itemId ?? "").trim();
  if (!rawId || DISALLOWED_ENCHANT_IDS.has(rawId.toLowerCase())) return 0;
  // Клієнт у processDrops пише kind як поле `type`; у магазині/екіпі — `kind`.
  const kind = String(row?.kind ?? row?.type ?? "").toLowerCase();
  const slot = String(row?.slot ?? "").toLowerCase();
  if (kind === "weapon") return 40;
  if (ARMOR_KINDS.has(kind) || ARMOR_SLOTS.has(slot)) return 30;
  const inferred = inferMaxEnchantFromItemId(rawId);
  return inferred;
}
