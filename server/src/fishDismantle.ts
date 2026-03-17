/**
 * Логіка розділки риби на сервері.
 * Незалежний модуль — не залежить від клієнтського коду (працює в production).
 *
 * Зброя/броня/бижутерія — шанс за 10 риб; ресурси, скарбничка, заточки — за 1 рибу.
 */
const GRADE_CHANCE: Record<string, number> = { D: 0.7, C: 0.7, B: 0.1, A: 0.1, S: 0.1 };
const ENCHANT_SCROLLS: string[] = [
  "d_enchant_weapon_scroll", "d_enchant_armor_scroll",
  "c_enchant_weapon_scroll", "c_enchant_armor_scroll",
  "b_enchant_weapon_scroll", "b_enchant_armor_scroll",
  "a_enchant_weapon_scroll", "a_enchant_armor_scroll",
  "s_enchant_weapon_scroll", "s_enchant_armor_scroll",
];

// Мінімальний мап itemId -> { name, slot, icon } для побудови інвентарних предметів
// Клієнт доповнює з itemsDB при відображенні
const ITEM_DEFS: Record<string, { name: string; slot: string; icon?: string; kind?: string }> = {
  treasure_box: { name: "Treasure Box", slot: "resource", icon: "/items/drops/resources/Etc_treasure_box_i00_0.jpg", kind: "resource" },
  d_enchant_weapon_scroll: { name: "D-grade Weapon Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/d_enchant_weapon_scroll.jpg", kind: "resource" },
  d_enchant_armor_scroll: { name: "D-grade Armor Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/d_enchant_armor_scroll.jpg", kind: "resource" },
  c_enchant_weapon_scroll: { name: "C-grade Weapon Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/c_enchant_weapon_scroll.jpg", kind: "resource" },
  c_enchant_armor_scroll: { name: "C-grade Armor Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/c_enchant_armor_scroll.jpg", kind: "resource" },
  b_enchant_weapon_scroll: { name: "B-grade Weapon Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/b_enchant_weapon_scroll.jpg", kind: "resource" },
  b_enchant_armor_scroll: { name: "B-grade Armor Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/b_enchant_armor_scroll.jpg", kind: "resource" },
  a_enchant_weapon_scroll: { name: "A-grade Weapon Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/a_enchant_weapon_scroll.jpg", kind: "resource" },
  a_enchant_armor_scroll: { name: "A-grade Armor Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/a_enchant_armor_scroll.jpg", kind: "resource" },
  s_enchant_weapon_scroll: { name: "S-grade Weapon Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/s_enchant_weapon_scroll.jpg", kind: "resource" },
  s_enchant_armor_scroll: { name: "S-grade Armor Enchant Scroll", slot: "resource", icon: "/items/drops/scrolls/s_enchant_armor_scroll.jpg", kind: "resource" },
};

// ID зброї/броні/біжутерії по грейдах (мінімальний набір для дропу)
const WEAPONS_BY_GRADE: Record<string, string[]> = {
  D: ["sword_of_eclipse", "sword_of_limit", "sword_of_nightmare", "squires_sword", "sword_of_dreams", "blade", "hatchet", "sword_of_occult"],
  C: ["cursed_maingauche", "samurai_longsword", "elven_sword", "sword_of_valhalla", "sword_of_delusion"],
  B: ["saber", "sword_of_rituals", "heavens_divider", "arkansas", "imperial_staff"],
  A: ["tallum_blade", "dark_screamer", "sirras_blade", "sword_of_ipsilon", "screaming_vortex"],
  S: ["dynasty_sword", "doom_crusher", "great_mars"],
};
const ARMOR_BY_GRADE: Record<string, string[]> = {
  D: ["mithril_helmet", "mithril_breastplate", "leather_helmet", "cloth_cap", "reinforced_leather_shirt", "tunic_of_knowledge"],
  C: ["plate_helmet", "chain_hood", "plate_leather_armor", "chain_mail_shirt", "dark_crystal_breastplate"],
  B: ["avadon_circlet", "avadon_helmet", "avadon_breastplate", "dark_crystal_leather_armor", "doom_plate_armor"],
  A: ["tallum_helmet", "dark_crystal_helmet", "tallum_plate_armor", "tallum_leather_armor", "armor_of_nightmare"],
  S: ["dynasty_plate_armor", "dynasty_leather_armor", "dynasty_robe"],
};
const JEWELRY_BY_GRADE: Record<string, string[]> = {
  D: ["shop_jewelry_d_enchanted_ring", "shop_jewelry_d_black_pearl_ring", "shop_jewelry_d_elven_ring", "shop_jewelry_d_red_crescent_earing", "shop_jewelry_d_necklace_of_devotion"],
  C: ["shop_jewelry_c_ring_of_mana", "shop_jewelry_c_ring_of_eva", "shop_jewelry_c_necklace_of_mermaid", "shop_jewelry_c_earing_of_ant", "shop_jewelry_c_ring_of_raid"],
  B: ["shop_jewelry_b_ring_of_sage", "shop_jewelry_b_necklace_of_protection", "shop_jewelry_b_earing_of_blessed", "shop_jewelry_b_ring_of_angles", "shop_jewelry_b_necklace_of_mana"],
  A: ["shop_jewelry_a_ring_of_queen", "shop_jewelry_a_necklace_of_valakas", "shop_jewelry_a_earing_of_antharas", "shop_jewelry_a_ring_of_core", "shop_jewelry_a_necklace_of_core"],
  S: ["shop_jewelry_s_ring_of_eva", "shop_jewelry_s_necklace_of_eva", "shop_jewelry_s_earing_of_eva", "shop_jewelry_s_ring_of_blessed", "shop_jewelry_s_necklace_of_blessed"],
};

// Ресурси (частковий список — без кристалів)
const RESOURCE_IDS: string[] = [
  "animal_bone", "animal_skin", "varnish", "ash", "stone_of_purity", "braided_hemp", "mold_hardener",
  "oriharukon_ore", "dye", "thread", "syncopure", "mithril_ore", "dragon_scale", "adamantite_nugget",
  "silver_nugget", "gold_nugget", "coal", "crystal", "gemstone_d", "gemstone_c", "gemstone_b",
  "suede", "animal_blood", "silver_mold", "steel_mold", "mithril_mold", "metal_hardener",
  "treasure_box",
];

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
    RESOURCE_IDS.forEach((id) => {
      if (id === "treasure_box") return;
      if (Math.random() * 100 < 0.8) resources[id] = (resources[id] || 0) + 1;
    });
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
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "jewelry", slot: def.slot, icon: def.icon, count: 1 });
  });
  result.weapons.forEach(({ id, count }) => {
    const def = getItemDef(id);
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "weapon", slot: "weapon", icon: def.icon, count: 1 });
  });
  result.armorPieces.forEach(({ id, count }) => {
    const def = getItemDef(id);
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "armor", slot: def.slot, icon: def.icon, count: 1 });
  });
  result.resources.forEach(({ id, count }) => {
    const def = getItemDef(id);
    items.push({ id, name: def.name, type: def.kind ?? "resource", slot: def.slot, icon: def.icon, count });
  });
  (result.enchantScrolls || []).forEach(({ id, count }) => {
    const def = getItemDef(id);
    items.push({ id, name: def.name, type: "resource", slot: def.slot, icon: def.icon, count });
  });
  return items;
}
