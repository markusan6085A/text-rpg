/**
 * Логіка розділки риби на сервері.
 * Зброя, броня, бижутерія, сундуки (treasure_box), заточки. Без ресурсів (ore, coal тощо).
 */
const GRADE_CHANCE: Record<string, number> = { D: 0.7, C: 0.7, B: 0.1, A: 0.1, S: 0.1 };

const ENCHANT_SCROLLS: string[] = [
  "d_enchant_weapon_scroll", "d_enchant_armor_scroll",
  "c_enchant_weapon_scroll", "c_enchant_armor_scroll",
  "b_enchant_weapon_scroll", "b_enchant_armor_scroll",
  "a_enchant_weapon_scroll", "a_enchant_armor_scroll",
  "s_enchant_weapon_scroll", "s_enchant_armor_scroll",
];

const ITEM_DEFS: Record<string, { name: string; slot: string; icon?: string; kind?: string }> = {
  treasure_box: { name: "Treasure Box", slot: "consumable", icon: "/items/drops/resources/Etc_treasure_box_i00_0.jpg", kind: "consumable" },
  d_enchant_weapon_scroll: { name: "Scroll: Enchant Weapon (D)", slot: "consumable", icon: "/items/drops/resources/etc_blessed_scrl_of_ench_wp_d_i01.png", kind: "consumable" },
  d_enchant_armor_scroll: { name: "Scroll: Enchant Armor (D)", slot: "consumable", icon: "/items/drops/resources/etc_blessed_scrl_of_ench_am_d_i01.png", kind: "consumable" },
  c_enchant_weapon_scroll: { name: "Scroll: Enchant Weapon (C)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i02.png", kind: "consumable" },
  c_enchant_armor_scroll: { name: "Scroll: Enchant Armor (C)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i02.png", kind: "consumable" },
  b_enchant_weapon_scroll: { name: "Scroll: Enchant Weapon (B)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i03.png", kind: "consumable" },
  b_enchant_armor_scroll: { name: "Scroll: Enchant Armor (B)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i03.png", kind: "consumable" },
  a_enchant_weapon_scroll: { name: "Scroll: Enchant Weapon (A)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i04.png", kind: "consumable" },
  a_enchant_armor_scroll: { name: "Scroll: Enchant Armor (A)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i04.png", kind: "consumable" },
  s_enchant_weapon_scroll: { name: "Scroll: Enchant Weapon (S)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i05.png", kind: "consumable" },
  s_enchant_armor_scroll: { name: "Scroll: Enchant Armor (S)", slot: "consumable", icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i05.png", kind: "consumable" },
};

// ID зброї/броні/бижутерії по грейдах — тільки ті, що є в itemsDB (клієнт)
const WEAPONS_BY_GRADE: Record<string, string[]> = {
  D: ["shop_weapon_d_knights_sword", "shop_weapon_d_shilen_knife", "shop_weapon_d_tomahawk", "shop_weapon_d_war_hammer", "shop_weapon_d_atuba_hammer", "shop_weapon_d_baguette_dual_sword", "shop_weapon_d_dark_elven_bow", "shop_weapon_d_triple_edged_jamadhr", "shop_weapon_d_two_handed_sword"],
  C: ["shop_weapon_c_samurai_longsword", "shop_weapon_c_dark_screamer", "shop_weapon_c_battle_axe", "shop_weapon_c_ecliptic_sword", "shop_weapon_c_widow_maker", "shop_weapon_c_demon_staff", "shop_weapon_c_berserker_blade"],
  B: ["shop_weapon_b_sword_of_valhalla", "shop_weapon_b_great_sword", "shop_weapon_b_great_axe", "shop_weapon_b_ice_storm_hammer", "shop_weapon_b_spirit_s_staff", "shop_weapon_b_star_buster", "shop_weapon_b_sword_of_damascus"],
  A: ["shop_weapon_a_tallum_blade", "shop_weapon_a_sirra_s_blade", "shop_weapon_a_sword_of_ipos", "shop_weapon_a_dragon_slayer", "shop_weapon_a_soul_bow", "shop_weapon_a_blood_tornado", "shop_weapon_a_dragon_grinder"],
  S: ["shop_weapon_s_angel_slayer", "shop_weapon_s_imperial_staff", "shop_weapon_s_god_s_blade", "shop_weapon_s_heaven_s_divider", "shop_weapon_s_demon_splinter", "shop_weapon_s_draconic_bow", "shop_weapon_s_saint_spear"],
};
const ARMOR_BY_GRADE: Record<string, string[]> = {
  D: ["mithril_helmet", "mithril_breastplate", "mithril_gaiters", "leather_helmet", "cloth_cap", "reinforced_leather_shirt", "tunic_of_knowledge"],
  C: ["demons_helmet", "demons_tunic", "karmian_helmet", "karmian_tunic", "plated_leather_helmet", "plated_leather", "demons_stockings"],
  B: ["avadon_circlet", "avadon_robe", "avadon_gloves", "avadon_boots", "doom_helmet", "doom_tunic", "doom_gloves"],
  A: ["dark_crystal_helmet", "dark_crystal_breastplate", "dark_crystal_gaiters", "dark_crystal_gloves", "dark_crystal_boots"],
  S: ["major_arcana_circlet", "major_arcana_robe", "draconic_leather_helmet", "draconic_leather_armor", "imperial_crusader_helmet", "imperial_crusader_breastplate"],
};
const JEWELRY_BY_GRADE: Record<string, string[]> = {
  D: ["shop_jewelry_d_enchanted_ring", "shop_jewelry_d_black_pearl_ring", "shop_jewelry_d_elven_ring", "shop_jewelry_d_red_crescent_earing", "shop_jewelry_d_necklace_of_devotion"],
  C: ["shop_jewelry_c_aquastone_ring", "shop_jewelry_c_ring_of_protection", "shop_jewelry_c_necklace_of_mermaid", "shop_jewelry_c_blessed_ring", "shop_jewelry_c_moonstone_earing", "shop_jewelry_c_earing_of_protection"],
  B: ["shop_jewelry_b_adamantite_ring", "shop_jewelry_b_sages_ring", "shop_jewelry_b_paradia_ring", "shop_jewelry_b_ring_of_solar_eclipse", "shop_jewelry_b_sages_earring", "shop_jewelry_b_paradia_earring"],
  A: ["shop_jewelry_a_majestic_ring", "shop_jewelry_a_ring_of_phantom", "shop_jewelry_a_phoenix_ring", "shop_jewelry_a_cerberus_ring", "shop_jewelry_a_majestic_earring", "shop_jewelry_a_phoenix_earring"],
  S: ["shop_jewelry_s_tateossian_ring", "shop_jewelry_s_tateossian_earring", "shop_jewelry_s_tateossian_necklace"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface FishDropResult {
  adena: number;
  coinOfLuck: number;
  coinsSilver: number;
  weapons: Array<{ id: string; count: number }>;
  armorPieces: Array<{ id: string; count: number }>;
  jewelryPieces: Array<{ id: string; count: number }>;
  resources: Array<{ id: string; count: number }>;
  enchantScrolls: Array<{ id: string; count: number }>;
}

export function processFishDrop(fishCount: number): FishDropResult {
  const weapons: Record<string, number> = {};
  const armorPieces: Record<string, number> = {};
  const jewelryPieces: Record<string, number> = {};
  const resources: Record<string, number> = {};
  const enchantScrolls: Record<string, number> = {};

  const batchesOf10 = Math.floor(fishCount / 10);
  for (let b = 0; b < batchesOf10; b++) {
    (["D", "C", "B", "A", "S"] as const).forEach((grade) => {
      const chance = GRADE_CHANCE[grade];
      if (Math.random() * 100 < chance && WEAPONS_BY_GRADE[grade]?.length) {
        const id = pick(WEAPONS_BY_GRADE[grade]);
        weapons[id] = (weapons[id] || 0) + 1;
      }
      if (Math.random() * 100 < chance && ARMOR_BY_GRADE[grade]?.length) {
        const id = pick(ARMOR_BY_GRADE[grade]);
        armorPieces[id] = (armorPieces[id] || 0) + 1;
      }
      if (Math.random() * 100 < chance && JEWELRY_BY_GRADE[grade]?.length) {
        const id = pick(JEWELRY_BY_GRADE[grade]);
        jewelryPieces[id] = (jewelryPieces[id] || 0) + 1;
      }
    });
  }

  for (let i = 0; i < fishCount; i++) {
    if (Math.random() * 100 < 0.3) resources["treasure_box"] = (resources["treasure_box"] || 0) + 1;
    if (Math.random() * 100 < 0.4) {
      const id = Math.random() < 0.7 ? pick(ENCHANT_SCROLLS.slice(0, 4)) : pick(ENCHANT_SCROLLS.slice(0, 6));
      if (id) enchantScrolls[id] = (enchantScrolls[id] || 0) + 1;
    }
  }

  return {
    adena: 0,
    coinOfLuck: 0,
    coinsSilver: 0,
    weapons: Object.entries(weapons).map(([id, count]) => ({ id, count })),
    armorPieces: Object.entries(armorPieces).map(([id, count]) => ({ id, count })),
    jewelryPieces: Object.entries(jewelryPieces).map(([id, count]) => ({ id, count })),
    resources: Object.entries(resources).map(([id, count]) => ({ id, count })),
    enchantScrolls: Object.entries(enchantScrolls).map(([id, count]) => ({ id, count })),
  };
}

export interface InventoryItemToAdd {
  id: string;
  name: string;
  type?: string;
  slot: string;
  icon?: string;
  count: number;
}

function getItemDef(id: string): { name: string; slot: string; icon?: string; kind?: string } {
  return ITEM_DEFS[id] ?? { name: id, slot: "resource", icon: "" };
}

export function buildItemsFromDrop(result: FishDropResult): InventoryItemToAdd[] {
  const items: InventoryItemToAdd[] = [];
  result.jewelryPieces.forEach(({ id, count }) => {
    const def = getItemDef(id);
    const slot = def.slot !== "resource" ? def.slot : "jewelry";
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: "jewelry", slot, icon: def.icon, count: 1 });
  });
  result.weapons.forEach(({ id, count }) => {
    const def = getItemDef(id);
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "weapon", slot: "weapon", icon: def.icon, count: 1 });
  });
  result.armorPieces.forEach(({ id, count }) => {
    const def = getItemDef(id);
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: "armor", slot: "armor", icon: def.icon, count: 1 });
  });
  result.resources.forEach(({ id, count }) => {
    if (id !== "treasure_box") return; // Тільки сундуки, жодних інших ресурсів
    const def = getItemDef(id);
    items.push({ id, name: def.name, type: def.kind ?? "consumable", slot: def.slot, icon: def.icon, count });
  });
  (result.enchantScrolls || []).forEach(({ id, count }) => {
    const def = getItemDef(id);
    items.push({ id, name: def.name, type: "consumable", slot: "consumable", icon: def.icon, count });
  });
  return items;
}
