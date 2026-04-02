// Дроп епік-РБ Core: Ring of Core ~30%; інше — C-grade (зброя/броня/біжутерія/скроли), трохи «старший» пул ніж у Queen Ant.
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

/** Унікальне кільце + 21 рядок C-grade (як у інших епіків l2dop). */
export const CORE_EPIC_DROPS: DropEntry[] = [
  {
    id: "ring_of_core",
    kind: "equipment",
    chance: 0,
    min: 1,
    max: 1,
    chancePerMillion: 300_000,
    l2ItemId: 6662,
  },
  secondary("shop_weapon_c_eminence_bow", 0),
  secondary("shop_weapon_c_berserker_blade", 1),
  secondary("shop_weapon_c_orcish_poleaxe", 2),
  secondary("shop_jewelry_c_ring_of_binding", 3),
  secondary("shop_jewelry_c_earing_of_binding", 4),
  secondary("shop_jewelry_c_nassen_earing", 5),
  secondary("shop_jewelry_c_necklace_of_binding", 6),
  secondary("full_plate_shield", 7),
  secondary("drake_leather_armor", 8),
  secondary("drake_leather_gloves", 9),
  secondary("drake_leather_boots", 10),
  secondary("drake_leather_helmet", 11),
  secondary("demons_tunic", 12),
  secondary("demons_stockings", 13),
  secondary("demons_gloves", 14),
  secondary("demons_boots", 15),
  secondary("demons_helmet", 16),
  secondary("c_enchant_weapon_scroll", 17),
  secondary("c_enchant_armor_scroll", 18),
  secondary("plated_leather", 19),
  secondary("plated_leather_gaiters", 20),
];
