// Дроп епік-РБ Queen Ant: Ring of Queen Ant 30%; інші 21 рядок — 4–7% (різні chancePerMillion).
// Предмети — топові з B-grade магазину (аналог скріну L2DB).

import type { DropEntry } from "../../combat/types";

const SECONDARY_CPM = [
  40000, 41500, 43000, 44500, 46000, 47500, 49000, 50500, 52000, 53500, 55000, 56500, 58000, 59500,
  61000, 62500, 64000, 65500, 67000, 68500, 70000,
] as const;

function secondary(id: string, index: number): DropEntry {
  return {
    id,
    kind: "equipment",
    chance: 0,
    min: 1,
    max: 1,
    chancePerMillion: SECONDARY_CPM[index]!,
  };
}

/** 22 рядки: кільце 30% + 21 шмот з магазину 4–7% кожен (незалежні roll). */
export const QUEEN_ANT_EPIC_DROPS: DropEntry[] = [
  {
    id: "ring_of_queen_ant",
    kind: "equipment",
    chance: 0,
    min: 1,
    max: 1,
    chancePerMillion: 300_000,
    l2ItemId: 6660,
  },
  secondary("shop_weapon_b_sword_of_valhalla", 0),
  secondary("shop_weapon_b_deadman_s_glory", 1),
  secondary("shop_weapon_b_lance", 2),
  secondary("shop_weapon_b_dark_elven_long_bow", 3),
  secondary("shop_weapon_b_hell_knife", 4),
  secondary("shop_weapon_b_spirit_s_staff", 5),
  secondary("shop_weapon_b_staff_of_evil_spirits", 6),
  secondary("shop_weapon_b_spell_breaker", 7),
  secondary("shop_weapon_b_arthro_nail", 8),
  secondary("doom_shield", 9),
  secondary("blue_wolf_breastplate", 10),
  secondary("blue_wolf_gaiters", 11),
  secondary("avadon_robe", 12),
  secondary("leather_armor_of_doom_of_fortune", 13),
  secondary("blue_wolf_gloves", 14),
  secondary("blue_wolf_boots", 15),
  secondary("blue_wolf_helmet", 16),
  secondary("shop_jewelry_b_ring_of_black_ore", 17),
  secondary("shop_jewelry_b_adamantite_earring", 18),
  secondary("shop_jewelry_b_necklace_of_black_ore", 19),
  secondary("d_enchant_weapon_scroll", 20),
];
