// Дроп епік-РБ Zaken: Earring of Zaken зазвичай гарантовано (100% roll); решта — B/A як у «старшому» пулі l2dop (скроли заточки, топ сети/зброя/біжутерія).
// Шанси другорядних рядків — щільніший список, ніж у QA/Core/Orfen (30 позицій), з тим самим діапазоном chancePerMillion ~30–66k.

import type { DropEntry } from "../../combat/types";

/** 30 рядків, лінійний крок (~31k … ~66.5k on million). */
const SECONDARY_CPM = Array.from({ length: 30 }, (_, i) => 31000 + Math.round((35500 / 29) * i)) as readonly number[];

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

/** Епік-сережка (100%) + 30 рядків B/A loot. */
export const ZAKEN_EPIC_DROPS: DropEntry[] = [
  {
    id: "earring_of_zaken",
    kind: "equipment",
    chance: 0,
    min: 1,
    max: 1,
    chancePerMillion: 1_000_000,
    l2ItemId: 6663,
  },
  secondary("shop_weapon_b_sword_of_damascus", 0),
  secondary("shop_weapon_b_lance", 1),
  secondary("shop_weapon_b_bow_of_peril", 2),
  secondary("shop_weapon_a_carnage_bow", 3),
  secondary("shop_weapon_a_dragon_slayer", 4),
  secondary("shop_weapon_a_halberd", 5),
  secondary("shop_jewelry_b_ring_of_black_ore", 6),
  secondary("shop_jewelry_b_earing_of_black_ore", 7),
  secondary("shop_jewelry_b_necklace_of_black_ore", 8),
  secondary("shop_jewelry_a_majestic_ring", 9),
  secondary("shop_jewelry_a_majestic_earring", 10),
  secondary("shop_jewelry_a_majestic_necklace", 11),
  secondary("shop_jewelry_a_phoenix_ring", 12),
  secondary("shop_jewelry_a_phoenix_earring", 13),
  secondary("b_enchant_weapon_scroll", 14),
  secondary("b_enchant_armor_scroll", 15),
  secondary("a_enchant_weapon_scroll", 16),
  secondary("a_enchant_armor_scroll", 17),
  secondary("blue_wolf_helmet", 18),
  secondary("blue_wolf_breastplate", 19),
  secondary("blue_wolf_gaiters", 20),
  secondary("blue_wolf_gloves", 21),
  secondary("blue_wolf_boots", 22),
  secondary("doom_helmet", 23),
  secondary("doom_tunic", 24),
  secondary("doom_stockings", 25),
  secondary("doom_gloves", 26),
  secondary("doom_boots", 27),
  secondary("avadon_circlet", 28),
  secondary("avadon_robe", 29),
];
