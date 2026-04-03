import type { ItemDefinition } from "../data/items/itemsDB.types";
import { itemsDBQuestShop } from "../data/items/itemsDB_quest_shop";
import { mysticSpellbookItemsDB } from "../data/items/itemsDB_spellbooks";
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
import { EPIC_JEWELRY_ITEM_IDS } from "./stats/armorEnchantBonuses";

/**
 * Предмети з квест-шопу: `itemsDB_quest_shop` + `QUEST_SHOP_ITEMS` + мапінг.
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

export const ADMIN_REGULAR_SHOP_ITEM_IDS = collectRegularShopItemIds();

const MYSTIC_SPELLBOOK_IDS = new Set(Object.keys(mysticSpellbookItemsDB));

const JEWELRY_KINDS = new Set(["ring", "necklace", "earring"]);

/** Каміння ЛС / кристали / фікс-камні в зброю — рожева підсвітка */
function isStoneHighlightItem(itemId: string): boolean {
  const id = itemId.toLowerCase();
  return id.startsWith("stone_") || id.startsWith("crystal_");
}

function isSpellbookHighlightItem(itemId: string, def: ItemDefinition): boolean {
  if (MYSTIC_SPELLBOOK_IDS.has(itemId)) return true;
  const id = itemId.toLowerCase();
  if (def.kind === "weapon" && id.includes("spellbook")) return true;
  return false;
}

function isEpicJewelryItem(itemId: string, def: ItemDefinition): boolean {
  return EPIC_JEWELRY_ITEM_IDS.has(itemId) && JEWELRY_KINDS.has(def.kind || "");
}

function isConsumableHighlightBucket(itemId: string, def: ItemDefinition): boolean {
  const k = def.kind || "";
  const sl = def.slot || "";
  if (k === "consumable" || sl === "consumable") return true;
  if (k === "tattoo") return true;
  return false;
}

function isResourceHighlightBucket(def: ItemDefinition): boolean {
  const k = def.kind || "";
  const sl = def.slot || "";
  if (k === "material") return true;
  if (k === "resource" || sl === "resource") return true;
  if (k === "quest" && (sl === "quest" || !sl)) return true;
  return false;
}

/**
 * Тип підсвітки в адмін-пікері (легенда + фільтр).
 * Порядок перевірки важливий (епіка та вітрини раніше за загальні відра).
 */
export type AdminItemPickerHighlight =
  | "epic_jewelry"
  | "quest_shop"
  | "regular_shop"
  | "spellbook"
  | "stone"
  | "resource"
  | "consumable"
  | "none";

export type AdminItemPickerFilter = AdminItemPickerHighlight | "all";

export function getAdminItemPickerHighlight(itemId: string, def: ItemDefinition): AdminItemPickerHighlight {
  if (isEpicJewelryItem(itemId, def)) return "epic_jewelry";
  if (ADMIN_QUEST_SHOP_ITEM_IDS.has(itemId)) return "quest_shop";
  if (ADMIN_REGULAR_SHOP_ITEM_IDS.has(itemId)) return "regular_shop";
  if (isSpellbookHighlightItem(itemId, def)) return "spellbook";
  if (isStoneHighlightItem(itemId)) return "stone";
  if (isResourceHighlightBucket(def)) return "resource";
  if (isConsumableHighlightBucket(itemId, def)) return "consumable";
  return "none";
}

/** @deprecated використовуйте getAdminItemPickerHighlight */
export type AdminItemPickerChrome = "quest_shop" | "regular_shop" | "none";

/** @deprecated */
export function getAdminItemPickerChrome(itemId: string): AdminItemPickerChrome {
  if (ADMIN_QUEST_SHOP_ITEM_IDS.has(itemId)) return "quest_shop";
  if (ADMIN_REGULAR_SHOP_ITEM_IDS.has(itemId)) return "regular_shop";
  return "none";
}

export const ADMIN_PICKER_LEGEND: ReadonlyArray<{
  filter: AdminItemPickerFilter;
  label: string;
  title: string;
  sampleClass: string;
}> = [
  {
    filter: "all",
    label: "Усі",
    title: "Показати всі предмети",
    sampleClass: "border border-[#c7ad80]/50 bg-gradient-to-br from-[#2a2418] to-black/60",
  },
  {
    filter: "regular_shop",
    label: "Магазин",
    title: "Магазин міста (зелений)",
    sampleClass:
      "border border-emerald-500/55 shadow-[0_0_8px_rgba(52,211,153,0.35)] bg-gradient-to-br from-emerald-900/55 to-black/50",
  },
  {
    filter: "quest_shop",
    label: "Квест-шоп",
    title: "Квест-шоп (червоний)",
    sampleClass:
      "border border-rose-500/55 shadow-[0_0_8px_rgba(244,63,94,0.3)] bg-gradient-to-br from-rose-900/55 to-black/50",
  },
  {
    filter: "epic_jewelry",
    label: "Епік біж.",
    title: "Епічна біжутерія (помаранчевий)",
    sampleClass:
      "border border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.35)] bg-gradient-to-br from-amber-900/50 to-black/50",
  },
  {
    filter: "resource",
    label: "Ресурси",
    title: "Ресурси та матеріали (сірий)",
    sampleClass: "border border-zinc-500/55 bg-gradient-to-br from-zinc-800/60 to-black/50",
  },
  {
    filter: "spellbook",
    label: "Книги",
    title: "Книги заклинань (синій)",
    sampleClass:
      "border border-sky-500/55 shadow-[0_0_8px_rgba(14,165,233,0.28)] bg-gradient-to-br from-sky-900/50 to-black/50",
  },
  {
    filter: "stone",
    label: "Камні / ЛС",
    title: "Камні заточки, кристали, ЛС (рожевий)",
    sampleClass:
      "border border-fuchsia-500/55 shadow-[0_0_8px_rgba(217,70,239,0.3)] bg-gradient-to-br from-fuchsia-900/45 to-black/50",
  },
  {
    filter: "consumable",
    label: "Розхідн.",
    title: "Розхідники (фіолетовий)",
    sampleClass:
      "border border-violet-500/55 shadow-[0_0_8px_rgba(167,139,250,0.28)] bg-gradient-to-br from-violet-900/45 to-black/50",
  },
  {
    filter: "none",
    label: "Інше",
    title: "Без категорії / дроп (золотава рамка)",
    sampleClass: "border border-[#c7ad80]/35 bg-gradient-to-br from-[#3d3428]/40 to-black/45",
  },
];

const BASE_CARD =
  "flex flex-col items-center p-2 rounded-md transition-all duration-150 hover:brightness-110";

const HIGHLIGHT_CARD: Record<AdminItemPickerHighlight, string> = {
  regular_shop: `${BASE_CARD} bg-gradient-to-b from-emerald-950/40 to-black/40 border border-emerald-500/50 shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_0_14px_rgba(16,185,129,0.18)] hover:border-emerald-400/85`,
  quest_shop: `${BASE_CARD} bg-gradient-to-b from-rose-950/45 to-black/40 border border-rose-500/50 shadow-[0_0_0_1px_rgba(251,113,133,0.28),0_0_16px_rgba(225,29,72,0.2)] hover:border-rose-400/85`,
  epic_jewelry: `${BASE_CARD} bg-gradient-to-b from-amber-950/40 to-black/40 border border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_0_14px_rgba(217,119,6,0.22)] hover:border-amber-400/85`,
  resource: `${BASE_CARD} bg-gradient-to-b from-zinc-900/45 to-black/40 border border-zinc-500/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-zinc-400/70`,
  spellbook: `${BASE_CARD} bg-gradient-to-b from-sky-950/40 to-black/40 border border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.2)] hover:border-sky-400/85`,
  stone: `${BASE_CARD} bg-gradient-to-b from-fuchsia-950/35 to-black/40 border border-fuchsia-500/50 shadow-[0_0_12px_rgba(217,70,239,0.22)] hover:border-fuchsia-400/85`,
  consumable: `${BASE_CARD} bg-gradient-to-b from-violet-950/35 to-black/40 border border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.2)] hover:border-violet-400/85`,
  none: `${BASE_CARD} bg-[#c7ad80]/5 border border-[#c7ad80]/25 hover:bg-[#c7ad80]/12 hover:border-[#c7ad80]/45`,
};

export function adminItemPickerButtonClass(h: AdminItemPickerHighlight): string {
  return HIGHLIGHT_CARD[h];
}

const BASE_INLINE =
  "flex items-center gap-0.5 py-0.5 px-1 rounded text-xs transition-colors border";

const HIGHLIGHT_INLINE: Record<AdminItemPickerHighlight, string> = {
  regular_shop: `${BASE_INLINE} bg-emerald-950/35 border-emerald-500/45 text-emerald-100/90 hover:bg-emerald-900/45`,
  quest_shop: `${BASE_INLINE} bg-rose-950/38 border-rose-500/45 text-rose-100/90 hover:bg-rose-900/45`,
  epic_jewelry: `${BASE_INLINE} bg-amber-950/35 border-amber-500/45 text-amber-100/90 hover:bg-amber-900/45`,
  resource: `${BASE_INLINE} bg-zinc-900/45 border-zinc-500/45 text-zinc-200 hover:bg-zinc-800/55`,
  spellbook: `${BASE_INLINE} bg-sky-950/35 border-sky-500/45 text-sky-100/90 hover:bg-sky-900/45`,
  stone: `${BASE_INLINE} bg-fuchsia-950/32 border-fuchsia-500/45 text-fuchsia-100/90 hover:bg-fuchsia-900/42`,
  consumable: `${BASE_INLINE} bg-violet-950/32 border-violet-500/45 text-violet-100/90 hover:bg-violet-900/42`,
  none: `${BASE_INLINE} bg-[#c7ad80]/10 border-[#c7ad80]/25 text-gray-300 hover:bg-[#c7ad80]/18`,
};

/** Компактна кнопка в AdminSectionItems */
export function adminItemInlineButtonClass(h: AdminItemPickerHighlight): string {
  return HIGHLIGHT_INLINE[h];
}
