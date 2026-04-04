// Адмін: встановити заточку предмета в інвентарі (тільки UI + hero store за isAdmin з API).
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import type { Hero, HeroInventoryItem } from "../types/Hero";
import { OVERFLOW_CHEST_ID } from "../state/heroStore";

/** Як на сервері (adminPlayers set-inventory-enchant): id ?? itemId */
export function inventoryRowItemId(row: any): string {
  return String(row?.id ?? row?.itemId ?? "").trim();
}

function inventoryRowMatchesFilteredItem(row: any, t: HeroInventoryItem): boolean {
  if (inventoryRowItemId(row) !== String(t.id ?? "").trim()) return false;
  const rowEnc = Math.max(0, Math.floor(Number(row?.enchantLevel ?? 0)));
  const rowCnt = Math.max(1, Math.floor(Number(row?.count ?? 1)));
  const enc = Math.max(0, Math.floor(Number(t.enchantLevel ?? 0)));
  const cnt = Math.max(1, Math.floor(Number(t.count ?? 1)));
  return rowEnc === enc && rowCnt === cnt;
}

/**
 * Індекс рядка в інвентарі з БД за вибраним рядком UI (filteredItems).
 * Потрібен свіжий snapshot з GET admin inventory — інакше локальний hero дає інший enc/index → 409 inventory changed.
 */
export function serverInventoryIndexFromFilteredSelection(
  serverInventory: any[],
  filteredItems: HeroInventoryItem[],
  filteredIndex: number
): number {
  if (
    !Array.isArray(serverInventory) ||
    filteredIndex < 0 ||
    filteredIndex >= filteredItems.length
  ) {
    return -1;
  }
  const t = filteredItems[filteredIndex];
  if (!t || t.id === OVERFLOW_CHEST_ID) return -1;

  let countBefore = 0;
  for (let i = 0; i < filteredIndex; i++) {
    const p = filteredItems[i];
    if (!p || p.id === OVERFLOW_CHEST_ID) continue;
    if (
      p.id === t.id &&
      (p.enchantLevel ?? 0) === (t.enchantLevel ?? 0) &&
      (p.count ?? 1) === (t.count ?? 1)
    ) {
      countBefore++;
    }
  }
  let seen = 0;
  return serverInventory.findIndex((row) => {
    if (!inventoryRowMatchesFilteredItem(row, t)) return false;
    if (seen === countBefore) return true;
    seen++;
    return false;
  });
}

/** Макс. +40 зброя, +30 броня/біжутерія/щит/плащ/пояс — як у handleEnchantScroll */
export function maxEnchantLevelForItemId(itemId: string): number {
  const def = itemsDB[itemId] || itemsDBWithStarter[itemId];
  if (!def) return 0;
  if (def.kind === "weapon") return 40;
  const isArmor =
    ["armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(
      def.kind || ""
    ) || ["necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(def.slot || "");
  return isArmor ? 30 : 0;
}

export function isAdminEnchantableInventoryItem(itemId: string): boolean {
  return maxEnchantLevelForItemId(itemId) > 0;
}

/** Індекс у hero.inventory для відфільтрованого рядка (дублікати id+enchant+count). */
export function heroInventoryIndexFromFilteredIndex(
  hero: Hero,
  filteredItems: HeroInventoryItem[],
  filteredIndex: number
): number {
  const inv = hero.inventory;
  if (!Array.isArray(inv) || filteredIndex < 0 || filteredIndex >= filteredItems.length) return -1;
  const t = filteredItems[filteredIndex];
  const id = t.id;
  const enc = t.enchantLevel ?? 0;
  const cnt = t.count ?? 1;
  let countBefore = 0;
  for (let i = 0; i < filteredIndex; i++) {
    const p = filteredItems[i];
    if (p.id === id && (p.enchantLevel ?? 0) === enc && (p.count ?? 1) === cnt) countBefore++;
  }
  let seen = 0;
  return inv.findIndex((i) => {
    if (i.id === id && (i.enchantLevel ?? 0) === enc && (i.count ?? 1) === cnt) {
      if (seen === countBefore) return true;
      seen++;
    }
    return false;
  });
}

export function applyAdminEnchantToHeroInventory(
  hero: Hero,
  inventoryIndex: number,
  rawLevel: string
): { ok: boolean; message?: string; inventory?: HeroInventoryItem[]; level?: number } {
  const inv = hero.inventory;
  if (!Array.isArray(inv) || inventoryIndex < 0 || inventoryIndex >= inv.length) {
    return { ok: false, message: "Рядок не знайдено" };
  }
  const row = inv[inventoryIndex];
  const maxEnc = maxEnchantLevelForItemId(row.id);
  if (maxEnc <= 0) return { ok: false, message: "Не заточується" };
  const n = Math.floor(Number(String(rawLevel).trim().replace(",", ".")));
  const level = Number.isFinite(n) ? Math.max(0, Math.min(maxEnc, n)) : 0;
  const next = [...inv];
  next[inventoryIndex] = { ...row, enchantLevel: level, count: row.count ?? 1 };
  return { ok: true, inventory: next, level };
}
