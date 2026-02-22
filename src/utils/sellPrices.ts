// Утиліти для розрахунку ціни продажу предметів

import { itemsDB } from "../data/items/itemsDB";
import { NG_GRADE_SHOP_ITEMS } from "../data/shop/ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../data/shop/sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../data/shop/consumablesShop";
import { SHOP_ITEM_ID_MAPPING } from "../data/shop/itemMappings";
import type { ItemDefinition } from "../data/items/itemsDB.types";

const ALL_SHOP = [
  ...NG_GRADE_SHOP_ITEMS,
  ...D_GRADE_SHOP_ITEMS,
  ...C_GRADE_SHOP_ITEMS,
  ...B_GRADE_SHOP_ITEMS,
  ...A_GRADE_SHOP_ITEMS,
  ...S_GRADE_SHOP_ITEMS,
  ...CONSUMABLES_SHOP_ITEMS,
];

/** itemsDB id -> shop price. 30% від ціни = sellPrice */
let _shopPriceCache: Record<string, number> | null = null;

function buildShopPriceMap(): Record<string, number> {
  if (_shopPriceCache) return _shopPriceCache;
  const map: Record<string, number> = {};
  ALL_SHOP.forEach((item: any) => {
    let id: string | undefined;
    if (item.id && item.id.startsWith("shop_")) {
      id = item.id.replace(/^shop_/, "");
    } else {
      id = SHOP_ITEM_ID_MAPPING[item.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
    }
    if (id && item.price != null) map[id] = item.price;
  });
  _shopPriceCache = map;
  return map;
}

/** Базові ціни по грейду для екіпу (30% від типової ціни магазину) — fallback для дроп-предметів */
const GRADE_BASE_SELL: Record<string, number> = {
  NG: 300,
  D: 15000,
  C: 45000,
  B: 150000,
  A: 450000,
  S: 1500000,
};

/** Ціна продажу для зброї/броні/біжутерії/заточок: 30% від ціни в магазині */
export function getEquipmentSellPrice(itemId: string, def?: ItemDefinition | null): number | null {
  const map = buildShopPriceMap();
  let shopPrice = map[itemId];
  if (shopPrice == null) {
    // Спробувати без префіксу shop_/quest_
    const altId = itemId.replace(/^(shop_|quest_)/, "");
    shopPrice = map[altId];
  }
  if (shopPrice != null) return Math.floor(shopPrice * 0.3);
  // Fallback для дроп-екіпу: за грейдом
  const grade = def?.grade?.toUpperCase() || "D";
  return GRADE_BASE_SELL[grade] ?? 15000;
}

/** Ресурси: ціна 1–1000 залежно від «рідкості». Без централізованого шансу дропу використовуємо хеш id. */
const RESOURCE_PRICE_OVERRIDE: Record<string, number> = {
  soulshot_ng: 200,
  spiritshot_ng: 200,
  // Рідкісні (високий шанс)
  soulstone_s: 900,
  soulstone_a: 800,
  soulstone_b: 600,
  soulstone_c: 400,
  soulstone_d: 300,
  // Середні
  crystallized_core: 500,
  adamantine_nugget: 450,
  crude_adamantine: 400,
  varnish: 350,
  "c-grade_armor_piece": 200,
  "b-grade_armor_piece": 350,
  "a-grade_armor_piece": 500,
  "s-grade_armor_piece": 700,
  thorns: 150,
  animal_bone: 120,
  exploration_ore: 180,
};

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

/** Ресурси: 1–1000 аден (чим рідкісніший — тим більше) */
export function getResourceSellPrice(itemId: string): number {
  if (RESOURCE_PRICE_OVERRIDE[itemId] != null) {
    return RESOURCE_PRICE_OVERRIDE[itemId];
  }
  const hash = simpleHash(itemId);
  return 100 + (hash % 900); // 100–1000
}

/** Визначає, чи предмет є ресурсом (для pricing) */
export function isResourceItem(def: ItemDefinition | undefined): boolean {
  if (!def) return false;
  return def.slot === "resource" || def.kind === "resource";
}

/** Повертає ціну продажу для предмета. null = не продається. */
export function getSellPrice(itemId: string, itemDef?: ItemDefinition | null): number | null {
  const def = itemDef ?? itemsDB[itemId];
  if (!def) return null;

  // Валюта, медаль печатей, Festival Adena — не продаються
  if (["adena", "coin_of_luck", "coins_silver", "ancient_adena", "seven_seals_medal", "coin_of_fair"].includes(itemId)) return null;

  // Ресурси — 1–1000
  if (isResourceItem(def)) return getResourceSellPrice(itemId);

  // Зброя, броня, біжутерія, щити, заточки — 30% від магазину (або fallback за грейдом)
  const isEquipment =
    def.kind === "weapon" || def.kind === "armor" || def.kind === "shield" ||
    def.kind === "jewelry" ||
    ["weapon", "lrhand", "head", "armor", "legs", "gloves", "boots", "belt", "shield", "lhand",
     "necklace", "earring", "ring", "jewelry"].includes(def.slot || "");
  if (isEquipment) return getEquipmentSellPrice(itemId, def);

  // Інші расходники (зелья, стріли, soulshot, spiritshot) — магазин або override
  const consumablePrice = getEquipmentSellPrice(itemId, def);
  if (consumablePrice != null && consumablePrice > 0) return consumablePrice;

  // Soulshot/Spiritshot NG — 200
  if (itemId === "soulshot_ng" || itemId === "spiritshot_ng") return 200;

  // Невідомий consumable/resource — ресурс за замовчуванням
  if (def.slot === "consumable" || def.slot === "resource") {
    return getResourceSellPrice(itemId);
  }

  return null;
}
