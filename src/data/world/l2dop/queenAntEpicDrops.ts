// Дроп епік-РБ Queen Ant: Ring of Queen Ant ~30%; інші рядки — D-grade шмот (4–7%), як у економіці проєкту.
// Унікальні roll по chancePerMillion.

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

/** Кільце + 21 рядок D-grade з магазину/сетів (аналог скріну, але грейд D). */
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
  secondary("shop_weapon_d_knights_sword", 0),
  secondary("shop_weapon_d_tomahawk", 1),
  secondary("shop_weapon_d_war_hammer", 2),
  secondary("shop_weapon_d_dark_elven_bow", 3),
  secondary("shop_weapon_d_shilen_knife", 4),
  secondary("shop_weapon_d_atuba_hammer", 5),
  secondary("shop_weapon_d_baguette_dual_sword", 6),
  secondary("shop_weapon_d_two_handed_sword", 7),
  secondary("shop_weapon_d_triple_edged_jamadhr", 8),
  secondary("plate_shield", 9),
  secondary("mithril_breastplate", 10),
  secondary("mithril_gaiters", 11),
  secondary("tunic_of_knowledge", 12),
  secondary("reinforced_leather_shirt", 13),
  secondary("mithril_gloves", 14),
  secondary("mithril_boots", 15),
  secondary("mithril_helmet", 16),
  secondary("shop_jewelry_d_mithril_ring", 17),
  secondary("shop_jewelry_d_elven_earing", 18),
  secondary("shop_jewelry_d_necklace_of_darkness", 19),
  secondary("d_enchant_weapon_scroll", 20),
];
