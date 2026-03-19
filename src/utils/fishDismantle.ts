/**
 * Логіка розділки риби — спільний модуль для клієнта та сервера.
 * Експортує processFishDrop та buildItemsFromDrop.
 */
import { itemsDB } from "../data/items/itemsDB";
import { D_GRADE_SHOP_ITEMS } from "../data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../data/shop/sGradeShop";
import { QUEST_SHOP_WEAPONS, QUEST_SHOP_SETS, QUEST_SHOP_ACCESSORIES } from "../data/shop/questShop";
import { SHOP_ITEM_ID_MAPPING } from "../data/shop/itemMappings";

const GRADE_CHANCE: Record<string, number> = { D: 0.7, C: 0.7, B: 0.1, A: 0.1, S: 0.1 };
const ENCHANT_SCROLLS_BY_GRADE: Record<string, string[]> = {
  D: ["d_enchant_weapon_scroll", "d_enchant_armor_scroll"],
  C: ["c_enchant_weapon_scroll", "c_enchant_armor_scroll"],
  B: ["b_enchant_weapon_scroll", "b_enchant_armor_scroll"],
  A: ["a_enchant_weapon_scroll", "a_enchant_armor_scroll"],
  S: ["s_enchant_weapon_scroll", "s_enchant_armor_scroll"],
};

function getShopIdsByTypeAndGrade(type: string): Record<string, string[]> {
  const allShop = [
    { items: D_GRADE_SHOP_ITEMS, grade: "D" },
    { items: C_GRADE_SHOP_ITEMS, grade: "C" },
    { items: B_GRADE_SHOP_ITEMS, grade: "B" },
    { items: A_GRADE_SHOP_ITEMS, grade: "A" },
    { items: S_GRADE_SHOP_ITEMS, grade: "S" },
  ];
  const questItems = [...QUEST_SHOP_WEAPONS, ...QUEST_SHOP_SETS, ...QUEST_SHOP_ACCESSORIES];
  const byGrade: Record<string, string[]> = {};

  allShop.forEach(({ items, grade }) => {
    const ids: string[] = [];
    items.forEach((shopItem: any) => {
      if (shopItem.type !== type) return;
      const id = SHOP_ITEM_ID_MAPPING[shopItem.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
      if (id && itemsDB[id]) ids.push(id);
    });
    if (ids.length > 0) byGrade[grade] = ids;
  });

  questItems.forEach((shopItem: any) => {
    if (shopItem.type !== type) return;
    const grade = shopItem.grade || "D";
    const id = shopItem.id;
    if (id && itemsDB[id]) {
      if (!byGrade[grade]) byGrade[grade] = [];
      if (!byGrade[grade].includes(id)) byGrade[grade].push(id);
    }
  });

  return byGrade;
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

/** Розділка риби: зброя, броня, бижутерія, сундуки, заточки. */
export function processFishDrop(fishCount: number): FishDropResult {
  const weapons: Record<string, number> = {};
  const armorPieces: Record<string, number> = {};
  const jewelryPieces: Record<string, number> = {};
  const resources: Record<string, number> = {};
  const enchantScrolls: Record<string, number> = {};

  const weaponsByGrade = getShopIdsByTypeAndGrade("weapon");
  const armorByGrade = getShopIdsByTypeAndGrade("armor");
  const jewelryByGrade = getShopIdsByTypeAndGrade("jewelry");

  const batchesOf10 = Math.floor(fishCount / 10);
  for (let b = 0; b < batchesOf10; b++) {
    (["D", "C", "B", "A", "S"] as const).forEach((grade) => {
      const chance = GRADE_CHANCE[grade];
      const weaponIds = weaponsByGrade[grade];
      const armorIds = armorByGrade[grade];
      const jewelryIds = jewelryByGrade[grade];
      if (weaponIds?.length && Math.random() * 100 < chance) {
        const id = weaponIds[Math.floor(Math.random() * weaponIds.length)];
        weapons[id] = (weapons[id] || 0) + 1;
      }
      if (armorIds?.length && Math.random() * 100 < chance) {
        const id = armorIds[Math.floor(Math.random() * armorIds.length)];
        armorPieces[id] = (armorPieces[id] || 0) + 1;
      }
      if (jewelryIds?.length && Math.random() * 100 < chance) {
        const id = jewelryIds[Math.floor(Math.random() * jewelryIds.length)];
        jewelryPieces[id] = (jewelryPieces[id] || 0) + 1;
      }
    });
  }

  for (let i = 0; i < fishCount; i++) {
    if (Math.random() * 100 < 0.3) resources["treasure_box"] = (resources["treasure_box"] || 0) + 1;
    if (Math.random() * 100 < 0.4) {
      const grade = Math.random() < 0.7 ? "D" : "C";
      const scrolls = ENCHANT_SCROLLS_BY_GRADE[grade];
      if (scrolls?.length && itemsDB[scrolls[0]]) {
        const id = scrolls[Math.floor(Math.random() * scrolls.length)];
        if (itemsDB[id]) enchantScrolls[id] = (enchantScrolls[id] || 0) + 1;
      }
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

/** Інвентарний предмет для додавання (мінімальна структура). */
export interface InventoryItemToAdd {
  id: string;
  name: string;
  type?: string;
  slot: string;
  icon?: string;
  description?: string;
  stats?: Record<string, unknown>;
  count: number;
}

/** Повертає масив предметів для додавання в інвентар з результату processFishDrop. */
export function buildItemsFromDrop(result: FishDropResult): InventoryItemToAdd[] {
  const items: InventoryItemToAdd[] = [];
  result.jewelryPieces.forEach(({ id, count }) => {
    const def = itemsDB[id];
    if (def) for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "jewelry", slot: def.slot, icon: def.icon, description: def.description, stats: def.stats, count: 1 });
  });
  result.weapons.forEach(({ id, count }) => {
    const def = itemsDB[id];
    if (def) for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "weapon", slot: def.slot, icon: def.icon, description: def.description, stats: def.stats, count: 1 });
  });
  result.armorPieces.forEach(({ id, count }) => {
    const def = itemsDB[id];
    if (def) for (let i = 0; i < count; i++) items.push({ id, name: def.name, type: def.kind ?? "armor", slot: def.slot, icon: def.icon, description: def.description, stats: def.stats, count: 1 });
  });
  result.resources.forEach(({ id, count }) => {
    if (id !== "treasure_box") return; // Тільки сундуки, жодних інших ресурсів
    const def = itemsDB[id];
    if (def) items.push({ id, name: def.name, type: "consumable", slot: "consumable", icon: def.icon, description: def.description, stats: def.stats, count });
  });
  (result.enchantScrolls || []).forEach(({ id, count }) => {
    const def = itemsDB[id];
    if (def) items.push({ id, name: def.name, type: "consumable", slot: "consumable", icon: def.icon, description: def.description, count });
  });
  return items;
}
