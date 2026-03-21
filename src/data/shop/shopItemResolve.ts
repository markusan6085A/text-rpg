import { itemsDB } from "../items/itemsDB";
import { SHOP_ITEM_ID_MAPPING } from "./itemMappings";
import type { ShopItem } from "./shopTypes";

function normalizeName(n: string) {
  return n.toLowerCase().replace(/\[.*?\]/g, "").trim();
}

function findByName(name: string): string[] {
  const target = normalizeName(name);
  return Object.keys(itemsDB).filter(
    (k) => normalizeName(itemsDB[k]?.name || "") === target
  );
}

/** Канонічний ключ itemsDB для рядка звичайного магазину (як після вирівнювання id у *.ts). */
export function resolveRegularShopItemsDBId(item: ShopItem): string {
  if (item.id && itemsDB[item.id]) return item.id;

  const byName = findByName(item.name);
  if (byName.length === 1) return byName[0];

  if (byName.length > 1) {
    const m = SHOP_ITEM_ID_MAPPING[item.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
    if (m && byName.includes(m)) return m;
    const shopLike = byName.filter((k) => k.startsWith("shop_"));
    if (shopLike.length === 1) return shopLike[0];
    const questLike = byName.filter((k) => k.startsWith("quest_"));
    if (questLike.length === 1) return questLike[0];
    throw new Error(
      `Ambiguous shop name "${item.name}" (itemId=${item.itemId}): ${byName.join(", ")}`
    );
  }

  const m = SHOP_ITEM_ID_MAPPING[item.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
  if (m && itemsDB[m]) return m;

  throw new Error(
    `Cannot resolve shop row "${item.name}" id=${item.id} itemId=${item.itemId}`
  );
}

/**
 * Ключ у мапі цін продажу (getEquipmentSellPrice): як раніше — без префікса shop_/quest_
 * для сумісності з існуючим lookup по інвентарю.
 */
export function regularShopItemPriceMapKey(item: ShopItem): string | undefined {
  const dbId = resolveRegularShopItemsDBId(item);
  return dbId.replace(/^(shop_|quest_)/, "") || dbId;
}
