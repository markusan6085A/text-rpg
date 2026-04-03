/** Каталог GM-шопу: краски AA, розсодники за адену. */

export interface DyeItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  grade: "S";
  statPlus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
  statMinus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
  effect: number;
}

export const GM_RASODNIKI_ITEM_IDS = [
  "crystal_d",
  "crystal_ls_d",
  "stone_crit",
  "stone_mcrit",
  "stone_maxhp",
  "stone_focus",
  "stone_lifesteal",
  "stone_guidance",
  "stone_empower",
  "stone_acumen",
  "stone_anger",
  "stone_atkspd",
] as const;

export const CRYSTAL_PRICE_ADENA = 10;
export const RASODNIKI_REQUIRED_LEVEL = 20;

/** Свитки Giant (100% заточка) у GM-шопі — поки 1 Adena за шт. */
export const GM_GIANT_SCROLL_ADENA_PRICE = 1;

export const GM_GIANT_ENCHANT_SCROLL_IDS = [
  "gm_giant_enchant_armor_d",
  "gm_giant_enchant_armor_c",
  "gm_giant_enchant_armor_b",
  "gm_giant_enchant_armor_a",
  "gm_giant_enchant_armor_s",
  "gm_giant_enchant_weapon_d",
  "gm_giant_enchant_weapon_c",
  "gm_giant_enchant_weapon_b",
  "gm_giant_enchant_weapon_a",
  "gm_giant_enchant_weapon_s",
] as const;

export const RASODNIKI_STONES_INFO: { id: string; icon: string; effect: string }[] = [
  { id: "stone_crit", icon: "/items/drops/item/Ench_wp_potion_violet_i00_0.jpg", effect: "Крит: +5%" },
  { id: "stone_mcrit", icon: "/items/drops/item/Ench_wp_stone_i02_0.jpg", effect: "Маг. крит: +5%" },
  { id: "stone_maxhp", icon: "/items/drops/item/Ench_am_stone_i03_0.jpg", effect: "Макс. HP: +10%" },
  { id: "stone_focus", icon: "/items/drops/item/Ench_am_stone_i02_0.jpg", effect: "Перезарядка скілів: -5%" },
  { id: "stone_lifesteal", icon: "/items/drops/item/Ench_wp_stone_i03_0.jpg", effect: "Відновлення HP від урону: 5%" },
  { id: "stone_guidance", icon: "/items/drops/item/Ench_wp_stone_i04_0.jpg", effect: "Витрата MP скілів: -5%" },
  { id: "stone_empower", icon: "/items/drops/item/Ench_wp_stone_i01_0.jpg", effect: "Урон скілів: +10%" },
  { id: "stone_acumen", icon: "/items/drops/item/Ench_wp_stone_i00_0.jpg", effect: "Швидкість касту: +5%" },
  { id: "stone_anger", icon: "/items/drops/item/Ench_am_potion_violet_i00_0.jpg", effect: "Сила крита: +5%" },
  { id: "stone_atkspd", icon: "/items/drops/item/Ench_am_stone_i04_0%20(1).jpg", effect: "Швидкість атаки: +5%" },
];

export const GM_SHOP_ITEMS: DyeItem[] = [
  { id: "dye_str_con", itemId: "dye_str_con", name: "Greater Dye (STR +4 CON -4)", price: 1, icon: "/items/drops/resources/str.png", description: "Більше атаки, але менше HP/CP", grade: "S", statPlus: "STR", statMinus: "CON", effect: 4 },
  { id: "dye_str_dex", itemId: "dye_str_dex", name: "Greater Dye (STR +4 DEX -4)", price: 1, icon: "/items/drops/resources/str.png", description: "Більше атаки, але повільніші удари та біг", grade: "S", statPlus: "STR", statMinus: "DEX", effect: 4 },
  { id: "dye_dex_str", itemId: "dye_dex_str", name: "Greater Dye (DEX +4 STR -4)", price: 1, icon: "/items/drops/resources/dye-dex.png", description: "Швидші удари/крити, але менша сила атаки", grade: "S", statPlus: "DEX", statMinus: "STR", effect: 4 },
  { id: "dye_dex_con", itemId: "dye_dex_con", name: "Greater Dye (DEX +4 CON -4)", price: 1, icon: "/items/drops/resources/dye-dex.png", description: "Швидші удари/крити, але менше HP/CP", grade: "S", statPlus: "DEX", statMinus: "CON", effect: 4 },
  { id: "dye_con_str", itemId: "dye_con_str", name: "Greater Dye (CON +4 STR -4)", price: 1, icon: "/items/drops/resources/dye-con.png", description: "Більше витривалості/HP, але менше атаки", grade: "S", statPlus: "CON", statMinus: "STR", effect: 4 },
  { id: "dye_con_dex", itemId: "dye_con_dex", name: "Greater Dye (CON +4 DEX -4)", price: 1, icon: "/items/drops/resources/dye-con.png", description: "Більше витривалості/HP, але менша швидкість", grade: "S", statPlus: "CON", statMinus: "DEX", effect: 4 },
  { id: "dye_int_men", itemId: "dye_int_men", name: "Greater Dye (INT +4 MEN -4)", price: 1, icon: "/items/drops/resources/int.png", description: "Максимальна маг. атака, менше MP/M.Def", grade: "S", statPlus: "INT", statMinus: "MEN", effect: 4 },
  { id: "dye_int_wit", itemId: "dye_int_wit", name: "Greater Dye (INT +4 WIT -4)", price: 1, icon: "/items/drops/resources/int.png", description: "Сильніша магія, але дуже повільний каст", grade: "S", statPlus: "INT", statMinus: "WIT", effect: 4 },
  { id: "dye_wit_men", itemId: "dye_wit_men", name: "Greater Dye (WIT +4 MEN -4)", price: 1, icon: "/items/drops/resources/wit.png", description: "Швидкий каст, менше MP/M.Def", grade: "S", statPlus: "WIT", statMinus: "MEN", effect: 4 },
  { id: "dye_wit_int", itemId: "dye_wit_int", name: "Greater Dye (WIT +4 INT -4)", price: 1, icon: "/items/drops/resources/wit.png", description: "Швидкий каст, але слабша магія", grade: "S", statPlus: "WIT", statMinus: "INT", effect: 4 },
];
