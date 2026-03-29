// Дроп епік-РБ Orfen: Earring of Orfen ~30% (як у L2 XML); інше — C-grade з економіки проєкту без High-Grade Life Stone.
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

/** Епік-сережка + 21 рядок C-grade (аналог скріну). */
export const ORFEN_EPIC_DROPS: DropEntry[] = [
  {
    id: "earring_of_orfen",
    kind: "equipment",
    chance: 0,
    min: 1,
    max: 1,
    chancePerMillion: 300_000,
    l2ItemId: 6661,
  },
  secondary("shop_weapon_c_widow_maker", 0),
  secondary("shop_weapon_c_akat_long_bow", 1),
  secondary("shop_weapon_c_crystal_dagger", 2),
  secondary("shop_weapon_c_war_axe", 3),
  secondary("shop_weapon_c_samurai_longsword", 4),
  secondary("shop_weapon_c_fisted_blade", 5),
  secondary("shop_weapon_c_yaksa_mace", 6),
  secondary("shop_weapon_c_paagrian_hammer", 7),
  secondary("shop_jewelry_c_necklace_of_mermaid", 8),
  secondary("shop_jewelry_c_earing_of_binding", 9),
  secondary("shop_jewelry_c_ring_of_ages", 10),
  secondary("plated_leather", 11),
  secondary("plated_leather_gaiters", 12),
  secondary("drake_leather_armor", 13),
  secondary("drake_leather_boots", 14),
  secondary("drake_leather_helmet", 15),
  secondary("demons_tunic", 16),
  secondary("demons_stockings", 17),
  secondary("full_plate_shield", 18),
  secondary("plated_leather_gloves", 19),
  secondary("c_enchant_weapon_scroll", 20),
];
