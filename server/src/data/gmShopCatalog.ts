/**
 * Server-side GM Shop catalog — price validation.
 * Mirrors src/screens/gmShop/gmShopCatalog.ts (data only, no React dependencies).
 */

const ADENA_UNIT_PRICE = 10;
const AA_UNIT_PRICE = 1;

/** Dye items bought with Ancient Adena (AA) */
const GM_SHOP_DYE_IDS = [
  "dye_str_con", "dye_str_dex", "dye_dex_str", "dye_dex_con",
  "dye_con_str", "dye_con_dex", "dye_int_men", "dye_int_wit",
  "dye_wit_men", "dye_wit_int",
];

/** Consumable/resource items bought with Adena */
const GM_RASODNIKI_ITEM_IDS = [
  "crystal_d", "crystal_ls_d",
  "stone_crit", "stone_mcrit", "stone_maxhp", "stone_focus",
  "stone_lifesteal", "stone_guidance", "stone_empower",
  "stone_acumen", "stone_anger", "stone_atkspd",
];

const GM_GIANT_ENCHANT_SCROLL_IDS = [
  "gm_giant_enchant_armor_d", "gm_giant_enchant_armor_c", "gm_giant_enchant_armor_b",
  "gm_giant_enchant_armor_a", "gm_giant_enchant_armor_s",
  "gm_giant_enchant_weapon_d", "gm_giant_enchant_weapon_c", "gm_giant_enchant_weapon_b",
  "gm_giant_enchant_weapon_a", "gm_giant_enchant_weapon_s",
];

const GM_BLESSED_CHARGE_IDS = [
  "gm_blessed_charge_d", "gm_blessed_charge_c", "gm_blessed_charge_b",
  "gm_blessed_charge_a", "gm_blessed_charge_s",
];

const GM_BLESS_SOUL_SCROLL_IDS = [
  "gm_bless_scroll_might", "gm_bless_scroll_haste", "gm_bless_scroll_focus",
  "gm_bless_scroll_death_whisper", "gm_bless_scroll_guidance", "gm_bless_scroll_vampiric_rage",
  "gm_bless_scroll_empower", "gm_bless_scroll_acumen", "gm_bless_scroll_wild_magic",
  "gm_bless_scroll_concentration", "gm_bless_scroll_shield", "gm_bless_scroll_magic_barrier",
  "gm_bless_scroll_wind_walk", "gm_bless_scroll_agility", "gm_bless_scroll_blessed_body",
  "gm_bless_scroll_blessed_soul", "gm_bless_scroll_regeneration", "gm_bless_scroll_clarity",
];

/** Map itemId → { unitPrice, currency } */
const SHOP_PRICE_MAP: Record<string, { unitPrice: number; currency: string }> = {};

for (const id of GM_SHOP_DYE_IDS) {
  SHOP_PRICE_MAP[id] = { unitPrice: AA_UNIT_PRICE, currency: "ancient_adena" };
}
for (const id of [
  ...GM_RASODNIKI_ITEM_IDS,
  ...GM_GIANT_ENCHANT_SCROLL_IDS,
  ...GM_BLESSED_CHARGE_IDS,
  ...GM_BLESS_SOUL_SCROLL_IDS,
]) {
  SHOP_PRICE_MAP[id] = { unitPrice: ADENA_UNIT_PRICE, currency: "adena" };
}

/**
 * Returns the server-authoritative price for a GM shop item.
 * Returns null if item is not in the catalog (purchase not allowed).
 */
export function getGmShopItemPrice(
  itemId: string
): { unitPrice: number; currency: string } | null {
  return SHOP_PRICE_MAP[itemId] ?? null;
}

/** All valid GM shop item IDs */
export const ALL_GM_SHOP_IDS = new Set(Object.keys(SHOP_PRICE_MAP));
