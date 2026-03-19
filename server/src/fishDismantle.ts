/**
 * Логіка розділки риби на сервері.
 * Тільки зброя, броня та сундуки (treasure_box).
 */
const GRADE_CHANCE: Record<string, number> = { D: 0.7, C: 0.7, B: 0.1, A: 0.1, S: 0.1 };

const ITEM_DEFS: Record<string, { name: string; slot: string; icon?: string; kind?: string }> = {
  treasure_box: { name: "Treasure Box", slot: "resource", icon: "/items/drops/resources/Etc_treasure_box_i00_0.jpg", kind: "resource" },
};

// ID зброї/броні по грейдах
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
  const resources: Record<string, number> = {};

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
    });
  }

  for (let i = 0; i < fishCount; i++) {
    if (Math.random() * 100 < 0.3) resources["treasure_box"] = (resources["treasure_box"] || 0) + 1;
  }

  return {
    adena: 0,
    coinOfLuck: 0,
    coinsSilver: 0,
    weapons: Object.entries(weapons).map(([id, count]) => ({ id, count })),
    armorPieces: Object.entries(armorPieces).map(([id, count]) => ({ id, count })),
    jewelryPieces: [],
    resources: Object.entries(resources).map(([id, count]) => ({ id, count })),
    enchantScrolls: [],
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
    for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: "armor", slot: "armor", icon: def.icon, count: 1 });
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
