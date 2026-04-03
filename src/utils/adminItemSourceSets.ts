import { itemsDBQuestShop } from "../data/items/itemsDB_quest_shop";
import { NG_GRADE_SHOP_ITEMS } from "../data/shop/ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../data/shop/sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../data/shop/consumablesShop";
import { SHOP_ITEM_ID_MAPPING } from "../data/shop/itemMappings";
import { QUEST_SHOP_ITEMS } from "../data/shop/questShop";
import { QUEST_SHOP_ITEM_MAPPING } from "../data/shop/questShopResolvedMapping";

/**
 * Предмети з квест-шопу (червона рамка в адмін-пікері): татуси/краски/ епіки з itemsDB_quest_shop
 * плюс усі позиції з екрана Quest Shop (`questShop.ts`) та їх резолв по `QUEST_SHOP_ITEM_MAPPING`.
 */
function collectQuestShopAdminIds(): Set<string> {
  const s = new Set<string>();
  for (const k of Object.keys(itemsDBQuestShop)) s.add(k);
  for (const item of QUEST_SHOP_ITEMS) {
    if (item.id) s.add(item.id);
    const mapped = QUEST_SHOP_ITEM_MAPPING[item.itemId as keyof typeof QUEST_SHOP_ITEM_MAPPING];
    if (mapped) s.add(mapped);
  }
  return s;
}

export const ADMIN_QUEST_SHOP_ITEM_IDS = collectQuestShopAdminIds();

function collectRegularShopItemIds(): Set<string> {
  const s = new Set<string>();
  const lists = [
    NG_GRADE_SHOP_ITEMS,
    D_GRADE_SHOP_ITEMS,
    C_GRADE_SHOP_ITEMS,
    B_GRADE_SHOP_ITEMS,
    A_GRADE_SHOP_ITEMS,
    S_GRADE_SHOP_ITEMS,
    CONSUMABLES_SHOP_ITEMS,
  ];
  for (const list of lists) {
    for (const it of list) {
      if (it.id) s.add(it.id);
      const mapped = SHOP_ITEM_ID_MAPPING[it.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
      if (mapped) s.add(mapped);
    }
  }
  for (const id of Object.values(SHOP_ITEM_ID_MAPPING)) {
    if (typeof id === "string" && id) s.add(id);
  }
  return s;
}

/** Предмети з основного магазину міста (грейди + розхідники), за itemsDB id */
export const ADMIN_REGULAR_SHOP_ITEM_IDS = collectRegularShopItemIds();

export type AdminItemPickerChrome = "quest_shop" | "regular_shop" | "none";

export function getAdminItemPickerChrome(itemId: string): AdminItemPickerChrome {
  if (ADMIN_QUEST_SHOP_ITEM_IDS.has(itemId)) return "quest_shop";
  if (ADMIN_REGULAR_SHOP_ITEM_IDS.has(itemId)) return "regular_shop";
  return "none";
}

/** Предмет є на вітрині квест-шопу або магазину міста (без «мертвих» id з БД) */
export function isAdminItemOnVendorLists(itemId: string): boolean {
  return getAdminItemPickerChrome(itemId) !== "none";
}

/** Рамка картки в пікері — нейтральна (без підсвітки джерела) */
export function adminItemPickerButtonClass(_chrome?: AdminItemPickerChrome): string {
  return "flex flex-col items-center p-2 rounded-md transition-all duration-150 hover:brightness-110 bg-black/35 border border-[#c7ad80]/25 hover:bg-black/45 hover:border-[#c7ad80]/45";
}

/** Компактна кнопка в AdminSectionItems — нейтральна рамка */
export function adminItemInlineButtonClass(_itemId?: string): string {
  return "flex items-center gap-0.5 py-0.5 px-1 rounded text-xs transition-colors bg-[#c7ad80]/10 text-gray-300 hover:bg-[#c7ad80]/20 border border-[#c7ad80]/25";
}
