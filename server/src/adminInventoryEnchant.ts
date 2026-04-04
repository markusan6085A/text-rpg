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

export function maxEnchantForInventoryRow(row: any): number {
  const rawId = String(row?.id ?? row?.itemId ?? "").trim();
  if (!rawId || DISALLOWED_ENCHANT_IDS.has(rawId.toLowerCase())) return 0;
  const kind = String(row?.kind ?? "").toLowerCase();
  const slot = String(row?.slot ?? "").toLowerCase();
  if (kind === "weapon") return 40;
  if (ARMOR_KINDS.has(kind) || ARMOR_SLOTS.has(slot)) return 30;
  return 0;
}
