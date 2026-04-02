import type { MarketListingDTO } from "../../utils/api";
import type { HeroInventoryItem } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { normalizeIconPath, FALLBACK_ICON } from "../../utils/itemIcon";

export function isCoinLuckMarketListing(L: MarketListingDTO): boolean {
  const s = L.itemSnapshot as Record<string, unknown> | null;
  return s?._marketKind === "coin_luck";
}

export type MarketSellPick = { source: "inventory" | "overflowChest"; index: number };

export type MarketSellRow = { item: HeroInventoryItem; source: "inventory" | "overflowChest"; index: number };

export function itemRowId(it: HeroInventoryItem & { itemId?: string }): string {
  return String(it.id ?? it.itemId ?? "").trim();
}

export function pickKey(p: MarketSellPick): string {
  return `${p.source}:${p.index}`;
}

export function stackCountOfItem(it: HeroInventoryItem): number {
  const n = Math.floor(Number(it.count) || 1);
  return n >= 1 ? n : 1;
}

export function displaySellItemName(it: HeroInventoryItem & { itemId?: string }): string {
  const id = itemRowId(it);
  const fromDb = id ? (itemsDB as Record<string, { name?: string }>)[id]?.name : undefined;
  if (fromDb) return fromDb;
  const n = it.name;
  if (n && !/^[a-z0-9_]+$/i.test(String(n).trim())) return String(n);
  return n || id || "Предмет";
}

/** Як у InventoryItemList: якщо в інвентарі немає/битий icon — беремо з itemsDB за id. */
export function resolveItemIconPath(it: HeroInventoryItem & { itemId?: string }): string {
  const key = itemRowId(it);
  const itemDef = key ? itemsDBWithStarter[key] || itemsDB[key] : undefined;
  return normalizeIconPath(it.icon || itemDef?.icon) || FALLBACK_ICON;
}

export const formatNum = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, ".");

/** Ціна лоту з DTO (рязок з BigInt або legacy number) → bigint без втрати точності */
export function listingLotPriceBi(L: Pick<MarketListingDTO, "price">): bigint {
  const p = L.price as unknown;
  if (typeof p === "bigint") return p;
  if (typeof p === "number" && Number.isFinite(p)) return BigInt(Math.trunc(p));
  if (typeof p === "string") {
    const t = p.replace(/\s/g, "").trim();
    if (/^\d+$/.test(t)) {
      try {
        return BigInt(t);
      } catch {
        return 0n;
      }
    }
  }
  const n = Math.trunc(Number(p));
  return BigInt(Number.isFinite(n) ? n : 0);
}

export function formatPriceBi(amount: bigint): string {
  if (amount <= 0n) return "0";
  const s = amount.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Часткова купівля: сума ділиться на кількість у лоті без остачі (як на сервері). */
export function marketPartialAllowed(lotTotal: bigint, lotCnt: number): boolean {
  const c = Math.max(1, Math.floor(Number(lotCnt) || 1));
  return c >= 1 && lotTotal >= 1n && lotTotal % BigInt(c) === 0n;
}

export function maxBuyableFromBalance(lotTotal: bigint, lotCnt: number, balance: number): number {
  const c = Math.max(1, Math.floor(Number(lotCnt) || 1));
  const bal = BigInt(Math.max(0, Math.floor(Number(balance) || 0)));
  if (lotTotal < 1n) return 0;
  if (marketPartialAllowed(lotTotal, c)) {
    const per = lotTotal / BigInt(c);
    if (per < 1n || bal < per) return 0;
    const byFunds = bal / per;
    const cap = BigInt(c);
    const q = byFunds < cap ? byFunds : cap;
    return Number(q);
  }
  return bal >= lotTotal ? c : 0;
}

export function payForMarketQty(lotTotal: bigint, lotCnt: number, qty: number): bigint {
  const c = Math.max(1, Math.floor(Number(lotCnt) || 1));
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  if (marketPartialAllowed(lotTotal, c)) {
    return (lotTotal / BigInt(c)) * BigInt(q);
  }
  return q >= c ? lotTotal : 0n;
}

export function msLeft(iso: string): number {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

export function formatTimeLeft(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h <= 0) return `${m} мин`;
  return `${h} ч ${m} мин`;
}
