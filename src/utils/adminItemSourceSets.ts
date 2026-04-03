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

/** Рамка картки в пікері предметів (адмінка) */
export function adminItemPickerButtonClass(chrome: AdminItemPickerChrome): string {
  const base =
    "flex flex-col items-center p-2 rounded-md transition-all duration-150 hover:brightness-110";
  if (chrome === "quest_shop") {
    return `${base} bg-gradient-to-b from-rose-950/50 to-black/40 border border-rose-500/55 shadow-[0_0_0_1px_rgba(251,113,133,0.35),0_0_16px_rgba(225,29,72,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-rose-400/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]`;
  }
  if (chrome === "regular_shop") {
    return `${base} bg-gradient-to-b from-emerald-950/35 to-black/40 border border-emerald-500/45 shadow-[0_0_0_1px_rgba(52,211,153,0.28),0_0_14px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-emerald-400/75 hover:shadow-[0_0_18px_rgba(34,197,94,0.28)]`;
  }
  return `${base} bg-[#c7ad80]/5 border border-[#c7ad80]/20 hover:bg-[#c7ad80]/15 hover:border-[#c7ad80]/40`;
}

/** Компактна кнопка в AdminSectionItems (рядок «Всі предмети») */
export function adminItemInlineButtonClass(itemId: string): string {
  const chrome = getAdminItemPickerChrome(itemId);
  const base = "flex items-center gap-0.5 py-0.5 px-1 rounded text-xs transition-colors";
  if (chrome === "quest_shop") {
    return `${base} bg-rose-950/40 border border-rose-500/50 text-rose-100/95 shadow-[0_0_8px_rgba(225,29,72,0.2)] hover:bg-rose-900/45`;
  }
  if (chrome === "regular_shop") {
    return `${base} bg-emerald-950/30 border border-emerald-500/45 text-emerald-100/95 shadow-[0_0_8px_rgba(16,185,129,0.15)] hover:bg-emerald-900/35`;
  }
  return `${base} bg-[#c7ad80]/10 text-gray-300 hover:bg-[#c7ad80]/20`;
}
