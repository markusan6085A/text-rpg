// Дроп гранд-епіків (Baium, Frintezza, Antharas, Valakas): унікальний «реліквійний» рядок ~30% (як QA/Core/Orfen),
// решта — 30 позицій S-grade з економіки проєкту (шанси по chancePerMillion, як у Zaken).

import type { DropEntry } from "../../combat/types";

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

const GRAND_EPIC_SECONDARIES: readonly string[] = [
  "shop_weapon_s_angel_slayer",
  "shop_weapon_s_apprentices_spellbook",
  "shop_weapon_s_arcana_mace",
  "shop_weapon_s_baguette_s_dualsword",
  "shop_weapon_s_basalt_battlehammer",
  "shop_weapon_s_demon_splinter",
  "shop_weapon_s_draconic_bow",
  "shop_weapon_s_dragon_hunter_axe",
  "shop_weapon_s_god_s_blade",
  "shop_weapon_s_heaven_s_divider",
  "shop_weapon_s_imperial_staff",
  "shop_weapon_s_saint_spear",
  "shop_weapon_s_shining_bow",
  "shop_jewelry_s_tateossian_ring",
  "shop_jewelry_s_tateossian_earring",
  "shop_jewelry_s_tateossian_necklace",
  "s_enchant_weapon_scroll",
  "s_enchant_armor_scroll",
  "imperial_crusader_helmet",
  "imperial_crusader_breastplate",
  "imperial_crusader_gaiters",
  "imperial_crusader_gauntlets",
  "imperial_crusader_boots",
  "imperial_crusader_shield",
  "draconic_leather_helmet",
  "draconic_leather_armor",
  "draconic_leather_gloves",
  "draconic_leather_boots",
  "major_arcana_circlet",
  "major_arcana_robe",
];

function buildGrandEpicDrops(epic: {
  id: string;
  l2ItemId: number;
}): DropEntry[] {
  return [
    {
      id: epic.id,
      kind: "equipment",
      chance: 0,
      min: 1,
      max: 1,
      chancePerMillion: 300_000,
      l2ItemId: epic.l2ItemId,
    },
    ...GRAND_EPIC_SECONDARIES.map((id, i) => secondary(id, i)),
  ];
}

export const BAIUM_EPIC_DROPS = buildGrandEpicDrops({ id: "ring_of_baium", l2ItemId: 6658 });
export const FRINTEZZA_EPIC_DROPS = buildGrandEpicDrops({ id: "necklace_of_frintezza", l2ItemId: 8191 });
export const ANTHARAS_EPIC_DROPS = buildGrandEpicDrops({ id: "earring_of_antharas", l2ItemId: 6656 });
export const VALAKAS_EPIC_DROPS = buildGrandEpicDrops({ id: "necklace_of_valakas", l2ItemId: 6657 });
