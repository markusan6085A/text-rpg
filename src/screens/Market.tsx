import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { loadHeroFromAPI } from "../state/heroStore/heroLoadAPI";
import { getCityUiVariant } from "../utils/cityUiVariant";
import {
  buyMarketListingApi,
  cancelMarketListingApi,
  createMarketListingApi,
  fetchMarketListings,
  fetchMyMarketListings,
  type Character,
  type MarketListingDTO,
  type MarketCurrency,
} from "../utils/api";
import type { HeroInventoryItem } from "../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { calculateEnchantedStats } from "./character/inventoryUtils";
import { normalizeIconPath, handleResourceIconError } from "../utils/itemIcon";
import { showToast } from "../state/toastStore";

interface MarketProps {
  navigate: (path: string) => void;
}

type Tab = "browse" | "sell" | "mine";

type MarketSellPick = { source: "inventory" | "overflowChest"; index: number };

type MarketSellRow = { item: HeroInventoryItem; source: "inventory" | "overflowChest"; index: number };

function itemRowId(it: HeroInventoryItem & { itemId?: string }): string {
  return String(it.id ?? it.itemId ?? "").trim();
}

function pickKey(p: MarketSellPick): string {
  return `${p.source}:${p.index}`;
}

function stackCountOfItem(it: HeroInventoryItem): number {
  const n = Math.floor(Number(it.count) || 1);
  return n >= 1 ? n : 1;
}

function displaySellItemName(it: HeroInventoryItem & { itemId?: string }): string {
  const id = itemRowId(it);
  const fromDb = id ? (itemsDB as Record<string, { name?: string }>)[id]?.name : undefined;
  if (fromDb) return fromDb;
  const n = it.name;
  if (n && !/^[a-z0-9_]+$/i.test(String(n).trim())) return String(n);
  return n || id || "Предмет";
}

const formatNum = (n: number) =>
  n.toLocaleString("ru-RU").replace(/\s/g, ".");

/** Часткова купівля: ціна ділиться на кількість у лоті без остачі (як на сервері). */
function marketPartialAllowed(lotTotal: number, lotCnt: number): boolean {
  const t = Math.floor(Number(lotTotal) || 0);
  const c = Math.max(1, Math.floor(Number(lotCnt) || 1));
  return c >= 1 && t % c === 0;
}

function maxBuyableFromBalance(lotTotal: number, lotCnt: number, balance: number): number {
  const t = Math.floor(Number(lotTotal) || 0);
  const c = Math.max(1, Math.floor(Number(lotCnt) || 1));
  const bal = Math.max(0, Math.floor(Number(balance) || 0));
  if (t < 1) return 0;
  if (marketPartialAllowed(t, c)) {
    const per = Math.floor(t / c);
    if (per < 1) return 0;
    return Math.min(c, Math.floor(bal / per));
  }
  return bal >= t ? c : 0;
}

function payForMarketQty(lotTotal: number, lotCnt: number, qty: number): number {
  const t = Math.floor(Number(lotTotal) || 0);
  const c = Math.max(1, Math.floor(Number(lotCnt) || 1));
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  if (marketPartialAllowed(t, c)) {
    return Math.floor(t / c) * q;
  }
  return q >= c ? t : 0;
}

function msLeft(iso: string): number {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

function formatTimeLeft(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h <= 0) return `${m} мин`;
  return `${h} ч ${m} мин`;
}

/** Одразу підтягуємо інвентар/валюту з відповіді ринку в store + localStorage, щоб union-merge у loadHeroFromAPI не «повернув» виставлений предмет. */
function applyMarketCharacterPatch(c: Character) {
  const store = useHeroStore.getState();
  const hero = store.hero;
  if (!hero) return;
  const hj = (c.heroJson as Record<string, unknown>) || {};
  const inv = Array.isArray(hj.inventory) ? hj.inventory : hero.inventory;
  const overflow = Array.isArray((hj as any).overflowChest) ? (hj as any).overflowChest : hero.overflowChest;
  const adena = Number(c.adena ?? 0);
  const col = Number(c.coinLuck ?? 0);
  const revRaw = (hj as any).heroRevision;
  const heroRevision =
    revRaw != null && Number.isFinite(Number(revRaw)) ? Number(revRaw) : undefined;

  // КРИТИЧНО: updateHero(..., persist) синхронно викликає immediateSave → PUT з expectedRevision з serverState.
  // Якщо спочатку оновити героя без serverState.heroRevision — 409 revision_conflict.
  store.updateServerState({
    coinLuck: col,
    updatedAt: Date.now(),
    ...(heroRevision != null ? { heroRevision } : {}),
  });

  store.updateHero(
    {
      adena,
      coinOfLuck: col,
      inventory: inv as HeroInventoryItem[],
      overflowChest: overflow as HeroInventoryItem[] | undefined,
      ...(heroRevision != null ? { heroRevision } : {}),
      heroJson: {
        ...(hero as any).heroJson,
        ...hj,
        inventory: inv,
        overflowChest: overflow,
        adena,
        coinOfLuck: col,
        ...(heroRevision != null ? { heroRevision } : {}),
      },
    } as any,
    { persist: true }
  );
}

export default function Market({ navigate }: MarketProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const cid = hero?.id || characterId || "";

  const isL2 = getCityUiVariant() === "l2";
  const l2Outer =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  const [tab, setTab] = useState<Tab>("browse");
  const [listings, setListings] = useState<MarketListingDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [myListings, setMyListings] = useState<MarketListingDTO[]>([]);
  const [tick, setTick] = useState(0);

  const [sellModalRow, setSellModalRow] = useState<MarketSellRow | null>(null);
  const [sellCurrency, setSellCurrency] = useState<MarketCurrency>("adena");
  const [sellUnitPrice, setSellUnitPrice] = useState<string>("1");
  const [sellAmount, setSellAmount] = useState<string>("1");
  const [sellBusy, setSellBusy] = useState(false);

  const [browseDetailListing, setBrowseDetailListing] = useState<MarketListingDTO | null>(null);
  const [browseBuyQty, setBrowseBuyQty] = useState<string>("1");
  const [browseBuyBusy, setBrowseBuyBusy] = useState(false);
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null);

  const refreshBrowse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMarketListings(page, 15);
      setListings(res.listings || []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      showToast(e?.message || "Не вдалося завантажити ринок", "error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const refreshMine = useCallback(async () => {
    if (!cid) return;
    try {
      const res = await fetchMyMarketListings(cid);
      setMyListings(res.listings || []);
    } catch (e: any) {
      showToast(e?.message || "Не вдалося завантажити ваші лоти", "error");
    }
  }, [cid]);

  useEffect(() => {
    void refreshBrowse();
  }, [refreshBrowse]);

  useEffect(() => {
    if (tab === "mine") void refreshMine();
  }, [tab, refreshMine]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const equippedIds = useMemo(() => {
    const eq = hero?.equipment || {};
    return new Set(
      Object.values(eq).filter((v): v is string => typeof v === "string" && v.length > 0)
    );
  }, [hero?.equipment]);

  const sellPreview = useMemo(() => {
    if (!sellModalRow) return { max: 0, unit: 0, amt: 0, lotTotal: 0 };
    const max = stackCountOfItem(sellModalRow.item);
    const unit = Math.floor(Number(String(sellUnitPrice).replace(/\s/g, "")) || 0);
    const amt = Math.floor(Number(String(sellAmount).replace(/\s/g, "")) || 0);
    const lotTotal = unit * amt;
    return { max, unit, amt, lotTotal };
  }, [sellModalRow, sellUnitPrice, sellAmount]);

  const sellRows = useMemo((): MarketSellRow[] => {
    if (!hero) return [];
    const allow = (it: HeroInventoryItem & { itemId?: string }) => {
      const rid = itemRowId(it);
      if (!rid) return false;
      if (rid === "overflow_chest") return false;
      if (rid === "seven_seals_medal") return false;
      return true;
    };
    const invPart: MarketSellRow[] = (hero.inventory || [])
      .map((item, index) => ({ item, source: "inventory" as const, index }))
      .filter(({ item }) => {
        if (!allow(item)) return false;
        return !equippedIds.has(itemRowId(item));
      });
    const ofPart: MarketSellRow[] = (hero.overflowChest || [])
      .map((item, index) => ({ item, source: "overflowChest" as const, index }))
      .filter(({ item }) => allow(item));
    return [...invPart, ...ofPart];
  }, [hero, equippedIds]);

  const syncHeroAfterMarket = async (c: Character) => {
    applyMarketCharacterPatch(c);
    const h = await loadHeroFromAPI();
    if (h) useHeroStore.getState().setHero(h);
  };

  const openSellModal = (row: MarketSellRow) => {
    const max = stackCountOfItem(row.item);
    setSellModalRow(row);
    setSellAmount(String(max));
    setSellUnitPrice("1");
  };

  const onCreateListing = async () => {
    if (!cid || !sellModalRow) {
      showToast("Оберіть предмет", "info");
      return;
    }
    const rowId = itemRowId(sellModalRow.item);
    if (!rowId) {
      showToast("Некоректний предмет", "info");
      return;
    }
    const maxAmt = stackCountOfItem(sellModalRow.item);
    const unit = Math.floor(Number(String(sellUnitPrice).replace(/\s/g, "")));
    const amt = Math.floor(Number(String(sellAmount).replace(/\s/g, "")));
    if (!Number.isFinite(unit) || unit < 1) {
      showToast("Ціна за 1 шт. ≥ 1", "info");
      return;
    }
    if (!Number.isFinite(amt) || amt < 1 || amt > maxAmt) {
      showToast(`Кількість від 1 до ${maxAmt}`, "info");
      return;
    }
    const total = unit * amt;
    if (!Number.isFinite(total) || total < 1 || total > Number.MAX_SAFE_INTEGER) {
      showToast("Занадто велика сума", "info");
      return;
    }
    setSellBusy(true);
    try {
      const res = await createMarketListingApi(cid, {
        inventoryItemId: rowId,
        currency: sellCurrency,
        unitPrice: unit,
        amount: amt,
        itemSource: sellModalRow.source,
        itemIndex: sellModalRow.index,
      });
      showToast("Лот виставлено (24 год)", "success");
      setSellModalRow(null);
      setSellUnitPrice("1");
      setSellAmount("1");
      await syncHeroAfterMarket(res.character);
      await refreshBrowse();
      await refreshMine();
      setTab("mine");
    } catch (e: any) {
      showToast(e?.message || "Помилка", "error");
    } finally {
      setSellBusy(false);
    }
  };

  const openBrowseDetail = (L: MarketListingDTO) => {
    const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
    const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
    const bal =
      L.currency === "adena" ? Number(hero?.adena ?? 0) : Number(hero?.coinOfLuck ?? 0);
    const maxCan = maxBuyableFromBalance(L.price, lotCnt, bal);
    setBrowseDetailListing(L);
    setBrowseBuyQty(String(maxCan > 0 ? maxCan : 1));
  };

  const browseBuyPreview = useMemo(() => {
    const L = browseDetailListing;
    if (!L || !hero) return null;
    const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
    const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
    const bal =
      L.currency === "adena" ? Number(hero.adena ?? 0) : Number(hero.coinOfLuck ?? 0);
    const maxCan = maxBuyableFromBalance(L.price, lotCnt, bal);
    const partial = marketPartialAllowed(L.price, lotCnt);
    const rawQ = Math.floor(Number(String(browseBuyQty).replace(/\s/g, "")) || 0);
    const qtyMaxPartial = Math.min(lotCnt, Math.max(0, maxCan));
    let qty = 0;
    if (partial) {
      qty =
        qtyMaxPartial <= 0 ? 0 : Math.min(qtyMaxPartial, Math.max(1, rawQ || 1));
    } else {
      qty = maxCan > 0 ? lotCnt : 0;
    }
    const pay = qty > 0 ? payForMarketQty(L.price, lotCnt, qty) : 0;
    const rowId = itemRowId(it) || String((it as { id?: string }).id || "").trim();
    const itemForStats = rowId ? { ...it, id: rowId } : null;
    const enchanted = itemForStats ? calculateEnchantedStats(itemForStats) : null;
    const itemDef = rowId ? itemsDBWithStarter[rowId] || itemsDB[rowId] : undefined;
    return {
      L,
      it,
      lotCnt,
      bal,
      maxCan,
      partial,
      qty,
      pay,
      enchanted,
      itemDef,
      rowId,
    };
  }, [browseDetailListing, browseBuyQty, hero]);

  const onConfirmBrowseBuy = async () => {
    if (!cid || !browseBuyPreview || browseBuyPreview.qty < 1) return;
    const { L, qty, lotCnt } = browseBuyPreview;
    if (L.sellerCharacterId === cid) return;
    if (!marketPartialAllowed(L.price, lotCnt) && qty !== lotCnt) {
      showToast("Часткова купівля недоступна для цього лоту", "info");
      return;
    }
    setBrowseBuyBusy(true);
    try {
      const res = await buyMarketListingApi(L.id, cid, qty);
      showToast("Куплено", "success");
      setBrowseDetailListing(null);
      await syncHeroAfterMarket(res.buyer);
      await refreshBrowse();
      await refreshMine();
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("partial_purchase") || msg.includes("partial")) {
        showToast("Часткова купівля для цього лоту недоступна", "error");
      } else {
        showToast(msg || "Не вдалося купити", "error");
      }
    } finally {
      setBrowseBuyBusy(false);
    }
  };

  const onCancel = async (listingId: string) => {
    if (!cid) return;
    setCancelBusyId(listingId);
    try {
      const res = await cancelMarketListingApi(listingId, cid);
      showToast("Лот знято, предмет повернуто", "success");
      await syncHeroAfterMarket(res.character);
      await refreshBrowse();
      await refreshMine();
    } catch (e: any) {
      showToast(e?.message || "Помилка", "error");
    } finally {
      setCancelBusyId(null);
    }
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center py-10 text-[#8a7a60] text-sm">
        Завантаження…
      </div>
    );
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={
        tab === t
          ? isL2
            ? "px-3 py-1.5 rounded-md border border-[#c7ad80]/55 bg-black/40 text-[#e8c56e] text-[11px]"
            : "px-3 py-1.5 rounded-md border border-amber-600/50 bg-amber-900/30 text-[#f4e2b8] text-[11px]"
          : isL2
            ? "px-3 py-1.5 rounded-md border border-[#5c4a32]/45 bg-black/25 text-[#a89878] text-[11px] hover:border-[#c7ad80]/35"
            : "px-3 py-1.5 rounded-md border border-black/50 bg-[#1a1510] text-[#c7ad80] text-[11px]"
      }
    >
      {label}
    </button>
  );

  const cardRow = isL2
    ? "flex gap-3 items-center p-3 rounded-lg border border-[#5c4a32]/55 bg-gradient-to-b from-[#2e2619]/90 to-[#14110c]/90 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "flex gap-3 items-center p-3 rounded-lg border border-black/60 bg-[#1a1510]";

  return (
    <div className="flex flex-col items-stretch px-2 py-4 max-w-lg mx-auto w-full min-w-0">
      <div className={isL2 ? l2Outer : "rounded-xl border border-white/20 bg-[#1a1510] overflow-hidden"}>
        <div
          className={
            isL2
              ? "px-3 py-2 border-b border-[#5c4a32]/45 bg-black/30 text-center text-[11px] text-[#e8c56e] tracking-wide uppercase"
              : "px-3 py-2 border-b border-black/70 bg-[#20160f] text-center text-[11px] text-[#f4e2b8] uppercase"
          }
        >
          Рынок игроков
        </div>

        <div className="px-3 py-3 space-y-3">
          <p className={isL2 ? "text-[11px] text-[#8a7a60] leading-snug" : "text-[11px] text-[#a89878]"}>
            Виставте предмет на 24 год. Після закінчення часу він повернеться в інвентар. Інші гравці
            бачать лоти й купують за адену або за Coin of Luck — залежно від валюти лоту.
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            {tabBtn("browse", "Все лоты")}
            {tabBtn("sell", "Выставить")}
            {tabBtn("mine", "Мои лоты")}
          </div>

          <div
            className={
              isL2
                ? "flex justify-between text-[11px] text-[#c9a44c]"
                : "flex justify-between text-[11px] text-amber-200/80"
            }
          >
            <span>Адена: {formatNum(hero.adena ?? 0)}</span>
            <span>CoL: {formatNum(hero.coinOfLuck ?? 0)}</span>
          </div>
        </div>

        {tab === "browse" && (
          <div className="px-3 pb-4 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <span className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-500"}>
                Всього: {total}
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => void refreshBrowse()}
                className={
                  isL2
                    ? "text-[10px] px-2 py-1 rounded border border-[#5c4a32]/55 text-[#e8c56e] hover:bg-black/30 disabled:opacity-50"
                    : "text-[10px] px-2 py-1 rounded border border-black/50 text-amber-200"
                }
              >
                {loading ? "…" : "Обновить"}
              </button>
            </div>
            {listings.length === 0 && !loading ? (
              <p className={isL2 ? "text-center text-[12px] text-[#8a7a60] py-6" : "text-center text-sm text-gray-500 py-6"}>
                Немає активних лотів
              </p>
            ) : (
              listings.map((L) => {
                const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
                const icon = normalizeIconPath(it?.icon);
                const own = L.sellerCharacterId === cid;
                const left = msLeft(L.expiresAt);
                void tick;
                const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
                const lotTotal = L.price;
                const perUnit =
                  lotCnt > 1 && lotTotal > 0 ? Math.floor(lotTotal / lotCnt) : lotTotal;
                const curLabel = L.currency === "adena" ? "аден" : "CoL";
                return (
                  <button
                    key={L.id}
                    type="button"
                    onClick={() => openBrowseDetail(L)}
                    className={`${cardRow} w-full text-left cursor-pointer hover:brightness-[1.03] active:brightness-95 transition-[filter]`}
                  >
                    <img
                      src={icon || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                      alt=""
                      className="w-10 h-10 object-contain rounded border border-[#5c4a32]/40 bg-black/40 shrink-0 pointer-events-none"
                      onError={handleResourceIconError}
                    />
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className={isL2 ? "text-[12px] font-semibold text-[#e8dcc8] truncate" : "text-sm text-amber-100 truncate"}>
                        {displaySellItemName(it)}
                        {it?.count && it.count > 1 ? ` ×${it.count}` : ""}
                        {own ? (
                          <span className={isL2 ? "text-[10px] text-[#6a5a48] font-normal ml-1" : "text-[10px] text-gray-500 ml-1"}>
                            (ваш)
                          </span>
                        ) : null}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-500"}>
                        Продавець: {L.sellerName}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#c9a44c] mt-0.5" : "text-[10px] text-amber-300/90 mt-0.5"}>
                        {left <= 0 ? (
                          <span className="text-[#9d6b6b]">Час вичерпано</span>
                        ) : lotCnt > 1 ? (
                          `${formatNum(lotTotal)} ${curLabel} за ${lotCnt} шт. (${formatNum(perUnit)} за шт.) · ${formatTimeLeft(left)}`
                        ) : (
                          `${formatNum(lotTotal)} ${curLabel} · ${formatTimeLeft(left)}`
                        )}
                      </div>
                    </div>
                    <span
                      className={
                        isL2
                          ? "text-[10px] text-[#8a7a60] shrink-0 self-center"
                          : "text-[10px] text-gray-500 shrink-0 self-center"
                      }
                    >
                      →
                    </span>
                  </button>
                );
              })
            )}
            {total > 15 && (
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-[10px] px-2 py-1 rounded border border-[#5c4a32]/50 text-[#d4c4a8] disabled:opacity-40"
                >
                  Назад
                </button>
                <span className="text-[10px] text-[#8a7a60] self-center">{page}</span>
                <button
                  type="button"
                  disabled={page * 15 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-[10px] px-2 py-1 rounded border border-[#5c4a32]/50 text-[#d4c4a8] disabled:opacity-40"
                >
                  Далі
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "sell" && (
          <div className="px-3 pb-4 space-y-3">
            <p className={isL2 ? "text-[11px] text-[#a89878]" : "text-[11px] text-gray-400"}>
              Зброя, броня, щити, ресурси, удочки, риба — усе з основного інвентаря або з переповнення (окремий
              блок нижче). Не можна виставити те, що зараз одягнуте.
            </p>
            <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
              {sellRows.length === 0 ? (
                <p className="text-[12px] text-[#8a7a60] text-center py-4">Немає предметів для продажу</p>
              ) : (
                <>
                  {sellRows.some((r) => r.source === "inventory") && (
                    <div className={isL2 ? "text-[10px] text-[#c9a44c] font-semibold pt-1" : "text-[10px] text-amber-200/80 pt-1"}>
                      Інвентар
                    </div>
                  )}
                  {sellRows
                    .filter((r) => r.source === "inventory")
                    .map((row) => {
                      const it = row.item;
                      return (
                        <button
                          key={pickKey(row)}
                          type="button"
                          onClick={() => openSellModal(row)}
                          className={`${cardRow} w-full text-left opacity-90 hover:opacity-100`}
                        >
                          <img
                            src={normalizeIconPath(it.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                            alt=""
                            className="w-9 h-9 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                            onError={handleResourceIconError}
                          />
                          <div className="min-w-0 flex-1">
                            <div className={isL2 ? "text-[12px] text-[#e8dcc8] truncate" : "text-sm truncate"}>
                              {displaySellItemName(it)}
                              {it.count && it.count > 1 ? ` ×${it.count}` : ""}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  {sellRows.some((r) => r.source === "overflowChest") && (
                    <div className={isL2 ? "text-[10px] text-[#c9a44c] font-semibold pt-2" : "text-[10px] text-amber-200/80 pt-2"}>
                      Переповнення
                    </div>
                  )}
                  {sellRows
                    .filter((r) => r.source === "overflowChest")
                    .map((row) => {
                      const it = row.item;
                      return (
                        <button
                          key={pickKey(row)}
                          type="button"
                          onClick={() => openSellModal(row)}
                          className={`${cardRow} w-full text-left opacity-90 hover:opacity-100`}
                        >
                          <img
                            src={normalizeIconPath(it.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                            alt=""
                            className="w-9 h-9 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                            onError={handleResourceIconError}
                          />
                          <div className="min-w-0 flex-1">
                            <div className={isL2 ? "text-[12px] text-[#e8dcc8] truncate" : "text-sm truncate"}>
                              {displaySellItemName(it)}
                              {it.count && it.count > 1 ? ` ×${it.count}` : ""}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </>
              )}
            </div>
            <p className={isL2 ? "text-[10px] text-[#6a5a48] text-center" : "text-[10px] text-gray-500 text-center"}>
              Натисніть предмет — відкриється вікно: кількість і ціна за 1 шт. Покупець платить добуток (наприклад 10×100 = 1000 аден).
            </p>
          </div>
        )}

        {tab === "mine" && (
          <div className="px-3 pb-4 space-y-2">
            <button
              type="button"
              onClick={() => void refreshMine()}
              className="text-[10px] px-2 py-1 rounded border border-[#5c4a32]/55 text-[#e8c56e] mb-2"
            >
              Обновить список
            </button>
            {myListings.length === 0 ? (
              <p className="text-center text-[12px] text-[#8a7a60] py-6">У вас немає активних лотів</p>
            ) : (
              myListings.map((L) => {
                const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
                const left = msLeft(L.expiresAt);
                void tick;
                const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
                const lotTotal = L.price;
                const perUnit =
                  lotCnt > 1 && lotTotal > 0 ? Math.floor(lotTotal / lotCnt) : lotTotal;
                const curLabel = L.currency === "adena" ? "аден" : "CoL";
                return (
                  <div key={L.id} className={cardRow}>
                    <img
                      src={normalizeIconPath(it?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                      alt=""
                      className="w-10 h-10 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                      onError={handleResourceIconError}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={isL2 ? "text-[12px] text-[#e8dcc8] truncate" : "text-sm truncate"}>
                        {displaySellItemName(it)}
                        {it?.count && it.count > 1 ? ` ×${it.count}` : ""}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#c9a44c]" : "text-[10px] text-amber-300"}>
                        {lotCnt > 1
                          ? `${formatNum(lotTotal)} ${curLabel} за ${lotCnt} шт. (${formatNum(perUnit)} за шт.) · ${formatTimeLeft(left)}`
                          : `${formatNum(lotTotal)} ${curLabel} · ${formatTimeLeft(left)}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={cancelBusyId === L.id}
                      onClick={() => void onCancel(L.id)}
                      className="text-[10px] px-2 py-1.5 rounded-md border border-[#9d6b6b]/55 text-[#e8b4b4] shrink-0"
                    >
                      {cancelBusyId === L.id ? "…" : "Снять"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div
          className={
            isL2
              ? "px-3 py-3 bg-black/35 border-t border-[#5c4a32]/45 flex gap-2"
              : "px-3 py-3 bg-[#120d08] border-t border-black/80 flex gap-2"
          }
        >
          <button
            type="button"
            onClick={() => navigate("/city")}
            className={
              isL2
                ? "flex-1 rounded-full bg-black/40 py-2 border border-[#5c4a32]/55 text-[11px] text-[#e8c56e]"
                : "flex-1 rounded-full bg-[#20160f] py-2 border border-black/60 text-[11px]"
            }
          >
            В город
          </button>
        </div>
      </div>

      {sellModalRow && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(0.75rem+2cm)] bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="market-sell-title"
          onClick={() => {
            if (!sellBusy) setSellModalRow(null);
          }}
        >
          <div
            className={
              isL2
                ? "w-full max-w-sm rounded-xl border border-[#c7ad80]/45 shadow-[0_16px_48px_rgba(0,0,0,0.75)] bg-[linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)] p-4 space-y-3 max-h-[90vh] overflow-y-auto"
                : "w-full max-w-sm rounded-xl border border-amber-800/50 bg-[#1a1510] p-4 space-y-3 max-h-[90vh] overflow-y-auto"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div id="market-sell-title" className={isL2 ? "text-center text-[13px] font-semibold text-[#e8c56e]" : "text-center text-sm font-semibold text-amber-100"}>
              Виставити на ринок
            </div>
            <div className="flex gap-3 items-center">
              <img
                src={
                  normalizeIconPath(sellModalRow.item.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"
                }
                alt=""
                className="w-12 h-12 object-contain rounded border border-[#5c4a32]/40 bg-black/40 shrink-0"
                onError={handleResourceIconError}
              />
              <div className="min-w-0 flex-1">
                <div className={isL2 ? "text-[12px] text-[#e8dcc8] font-medium truncate" : "text-sm text-amber-50 truncate"}>
                  {displaySellItemName(sellModalRow.item)}
                </div>
                <div className={isL2 ? "text-[10px] text-[#8a7a60] mt-0.5" : "text-[10px] text-gray-500 mt-0.5"}>
                  У вас: {sellPreview.max} шт.
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>Кількість</label>
              <input
                type="text"
                inputMode="numeric"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value.replace(/[^\d]/g, ""))}
                className={
                  isL2
                    ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                    : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>
                Ціна за 1 шт.
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={sellUnitPrice}
                onChange={(e) => setSellUnitPrice(e.target.value.replace(/[^\d]/g, ""))}
                className={
                  isL2
                    ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                    : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
                }
              />
            </div>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setSellCurrency("adena")}
                className={
                  sellCurrency === "adena"
                    ? "text-[11px] px-3 py-1 rounded-full border border-[#c7ad80]/50 text-[#e8c56e]"
                    : "text-[11px] px-3 py-1 rounded-full border border-[#5c4a32]/40 text-[#8a7a60]"
                }
              >
                Адена
              </button>
              <button
                type="button"
                onClick={() => setSellCurrency("coinLuck")}
                className={
                  sellCurrency === "coinLuck"
                    ? "text-[11px] px-3 py-1 rounded-full border border-[#c7ad80]/50 text-[#e8c56e]"
                    : "text-[11px] px-3 py-1 rounded-full border border-[#5c4a32]/40 text-[#8a7a60]"
                }
              >
                Coin of Luck
              </button>
            </div>

            <div className={isL2 ? "text-[11px] text-[#c9a44c] text-center" : "text-[11px] text-amber-200/90 text-center"}>
              Покупець заплатить:{" "}
              <span className="font-semibold">
                {sellCurrency === "adena"
                  ? `${formatNum(sellPreview.lotTotal)} аден`
                  : `${formatNum(sellPreview.lotTotal)} CoL`}
              </span>
              {sellPreview.max > 1 && sellPreview.unit > 0 && sellPreview.amt > 0 ? (
                <span className="text-[#8a7a60]"> ({sellPreview.amt}×{formatNum(sellPreview.unit)})</span>
              ) : null}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={sellBusy}
                onClick={() => !sellBusy && setSellModalRow(null)}
                className={
                  isL2
                    ? "flex-1 py-2.5 rounded-md border border-[#5c4a32]/55 text-[11px] text-[#a89878] hover:bg-black/25"
                    : "flex-1 py-2.5 rounded-md border border-black/50 text-[11px] text-gray-400"
                }
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={sellBusy}
                onClick={() => void onCreateListing()}
                className={
                  isL2
                    ? "flex-1 py-2.5 rounded-md bg-black/35 border border-[#c7ad80]/40 text-[#e8c56e] text-[11px] font-semibold hover:brightness-110 disabled:opacity-50"
                    : "flex-1 py-2.5 rounded-md bg-amber-900/40 border border-amber-700/50 text-[#f4e2b8] text-[11px] disabled:opacity-50"
                }
              >
                {sellBusy ? "…" : "Выставить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {browseDetailListing && browseBuyPreview && hero && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(0.75rem+2cm)] bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="market-browse-detail-title"
          onClick={() => {
            if (!browseBuyBusy) setBrowseDetailListing(null);
          }}
        >
          <div
            className={
              isL2
                ? "w-full max-w-sm rounded-xl border border-[#c7ad80]/45 shadow-[0_16px_48px_rgba(0,0,0,0.75)] bg-[linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)] p-4 space-y-3 max-h-[90vh] overflow-y-auto"
                : "w-full max-w-sm rounded-xl border border-amber-800/50 bg-[#1a1510] p-4 space-y-3 max-h-[90vh] overflow-y-auto"
            }
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const { L, it, lotCnt, bal, maxCan, partial, qty, pay, enchanted, itemDef } = browseBuyPreview;
              const own = L.sellerCharacterId === cid;
              const left = msLeft(L.expiresAt);
              void tick;
              const curLabel = L.currency === "adena" ? "аден" : "CoL";
              const perUnit =
                lotCnt > 1 && L.price > 0 ? Math.floor(L.price / lotCnt) : L.price;
              const showEquipStats =
                enchanted && (enchanted.isWeapon || enchanted.isArmor);
              const el = Number(enchanted?.enchantLevel ?? it.enchantLevel ?? 0);
              const {
                pAtk,
                mAtk,
                pDef,
                mDef,
                baseStats,
                isWeapon,
                isArmor,
                enchantMultiplier,
                armorEnchantMultiplier,
              } = enchanted || {};

              return (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      id="market-browse-detail-title"
                      className={
                        isL2
                          ? "text-center text-[13px] font-semibold text-[#e8c56e] flex-1"
                          : "text-center text-sm font-semibold text-amber-100 flex-1"
                      }
                    >
                      Лот на ринку
                    </div>
                    <button
                      type="button"
                      className="text-[#8a7a60] hover:text-[#e8dcc8] text-lg leading-none px-1"
                      onClick={() => !browseBuyBusy && setBrowseDetailListing(null)}
                      aria-label="Закрити"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex gap-3 items-start">
                    <img
                      src={
                        normalizeIconPath(it?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"
                      }
                      alt=""
                      className="w-14 h-14 object-contain rounded border border-[#5c4a32]/40 bg-black/40 shrink-0"
                      onError={handleResourceIconError}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          isL2
                            ? "text-[13px] font-medium text-[#e8dcc8] leading-snug"
                            : "text-sm text-amber-50 leading-snug"
                        }
                      >
                        {displaySellItemName(it)}
                        {el > 0 ? ` +${el}` : ""}
                        {lotCnt > 1 ? ` ×${lotCnt}` : ""}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#8a7a60] mt-1" : "text-[10px] text-gray-500 mt-1"}>
                        Продавець: {L.sellerName}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#c9a44c] mt-0.5" : "text-[10px] text-amber-300/90 mt-0.5"}>
                        {left <= 0
                          ? "Термін лоту минув"
                          : lotCnt > 1
                            ? `${formatNum(L.price)} ${curLabel} за ${lotCnt} шт. (${formatNum(perUnit)} за шт.) · ${formatTimeLeft(left)}`
                            : `${formatNum(L.price)} ${curLabel} · ${formatTimeLeft(left)}`}
                      </div>
                    </div>
                  </div>

                  {itemDef?.description ? (
                    <p className={isL2 ? "text-[10px] text-[#a89878] leading-snug" : "text-[10px] text-gray-400 leading-snug"}>
                      {itemDef.description}
                    </p>
                  ) : null}

                  {showEquipStats ? (
                    <div
                      className={
                        isL2
                          ? "space-y-1 rounded-lg border border-[#5c4a32]/45 bg-black/25 px-2 py-2 text-[11px]"
                          : "space-y-1 rounded-lg border border-black/50 bg-black/20 px-2 py-2 text-[11px]"
                      }
                    >
                      <div className={isL2 ? "text-[10px] text-[#c9a44c] font-semibold mb-1" : "text-[10px] text-amber-200/90 mb-1"}>
                        Характеристики
                      </div>
                      {pAtk !== undefined && pAtk > 0 && (
                        <div className="flex justify-between gap-2 text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">Фіз. атака</span>
                          <span className="text-red-400">
                            {pAtk}
                            {el > 0 && isWeapon && baseStats?.pAtk && enchantMultiplier ? (
                              <span className="text-[#b8860b] ml-1">
                                (+{Math.round(baseStats.pAtk * (enchantMultiplier - 1))})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      )}
                      {mAtk !== undefined && mAtk > 0 && (
                        <div className="flex justify-between gap-2 text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">Маг. атака</span>
                          <span className="text-purple-400">
                            {mAtk}
                            {el > 0 && isWeapon && baseStats?.mAtk && enchantMultiplier ? (
                              <span className="text-[#b8860b] ml-1">
                                (+{Math.round(baseStats.mAtk * (enchantMultiplier - 1))})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      )}
                      {pDef !== undefined && pDef > 0 && (
                        <div className="flex justify-between gap-2 text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">Фіз. захист</span>
                          <span className="text-blue-400">
                            {pDef}
                            {el > 0 && isArmor && baseStats?.pDef && armorEnchantMultiplier ? (
                              <span className="text-[#b8860b] ml-1">
                                (+{Math.round(baseStats.pDef * (armorEnchantMultiplier - 1))})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      )}
                      {mDef !== undefined && mDef > 0 && (
                        <div className="flex justify-between gap-2 text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">Маг. захист</span>
                          <span className="text-cyan-400">
                            {mDef}
                            {el > 0 && isArmor && baseStats?.mDef && armorEnchantMultiplier ? (
                              <span className="text-[#b8860b] ml-1">
                                (+{Math.round(baseStats.mDef * (armorEnchantMultiplier - 1))})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      )}
                      {itemDef?.stats?.STR ? (
                        <div className="flex justify-between text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">STR</span>
                          <span className="text-yellow-300">+{itemDef.stats.STR}</span>
                        </div>
                      ) : null}
                      {itemDef?.stats?.DEX ? (
                        <div className="flex justify-between text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">DEX</span>
                          <span className="text-yellow-300">+{itemDef.stats.DEX}</span>
                        </div>
                      ) : null}
                      {itemDef?.stats?.CON ? (
                        <div className="flex justify-between text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">CON</span>
                          <span className="text-yellow-300">+{itemDef.stats.CON}</span>
                        </div>
                      ) : null}
                      {itemDef?.stats?.INT ? (
                        <div className="flex justify-between text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">INT</span>
                          <span className="text-yellow-300">+{itemDef.stats.INT}</span>
                        </div>
                      ) : null}
                      {itemDef?.stats?.WIT ? (
                        <div className="flex justify-between text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">WIT</span>
                          <span className="text-yellow-300">+{itemDef.stats.WIT}</span>
                        </div>
                      ) : null}
                      {itemDef?.stats?.MEN ? (
                        <div className="flex justify-between text-[#e8dcc8]">
                          <span className="text-[#8a7a60]">MEN</span>
                          <span className="text-yellow-300">+{itemDef.stats.MEN}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {own ? (
                    <p className={isL2 ? "text-[11px] text-[#8a7a60] text-center" : "text-[11px] text-gray-500 text-center"}>
                      Це ваш лот — купівля недоступна.
                    </p>
                  ) : left <= 0 ? (
                    <p className={isL2 ? "text-[11px] text-[#9d6b6b] text-center" : "text-[11px] text-red-300/90 text-center"}>
                      Лот більше не активний.
                    </p>
                  ) : maxCan < 1 ? (
                    <>
                      <p className={isL2 ? "text-[11px] text-[#9d6b6b] text-center" : "text-[11px] text-red-300/90 text-center"}>
                        Недостатньо {curLabel} для купівлі цього лоту.
                      </p>
                      <button
                        type="button"
                        disabled={browseBuyBusy}
                        onClick={() => !browseBuyBusy && setBrowseDetailListing(null)}
                        className={
                          isL2
                            ? "w-full py-2.5 rounded-md border border-[#5c4a32]/55 text-[11px] text-[#a89878] hover:bg-black/25"
                            : "w-full py-2.5 rounded-md border border-black/50 text-[11px] text-gray-400"
                        }
                      >
                        Закрити
                      </button>
                    </>
                  ) : (
                    <>
                      {!partial && lotCnt > 1 ? (
                        <p className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>
                          Часткова купівля недоступна (сума не ділиться на кількість без остачі) — продається лише весь стек{" "}
                          {lotCnt} шт.
                        </p>
                      ) : null}
                      <div className={isL2 ? "text-[11px] text-[#c9a44c]" : "text-[11px] text-amber-200/90"}>
                        У вас: {formatNum(bal)} {curLabel}. Можна купити до{" "}
                        <span className="font-semibold text-[#e8c56e]">{maxCan}</span> шт.
                      </div>
                      {partial ? (
                        <div className="space-y-1.5">
                          <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>
                            Скільки купити (1…{Math.min(lotCnt, maxCan)})
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={browseBuyQty}
                            onChange={(e) => setBrowseBuyQty(e.target.value.replace(/[^\d]/g, ""))}
                            className={
                              isL2
                                ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                                : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
                            }
                          />
                        </div>
                      ) : null}
                      {!partial && maxCan > 0 ? (
                        <div className={isL2 ? "text-[11px] text-[#e8dcc8]" : "text-[11px] text-amber-50"}>
                          Кількість: <span className="font-semibold">{lotCnt}</span> шт. (повний стек)
                        </div>
                      ) : null}
                      <div className={isL2 ? "text-[11px] text-center text-[#e8dcc8]" : "text-[11px] text-center text-amber-50"}>
                        До сплати:{" "}
                        <span className="font-semibold text-[#e8c56e]">
                          {formatNum(pay)} {curLabel}
                        </span>
                        {qty > 0 && qty !== lotCnt ? (
                          <span className={isL2 ? "text-[#8a7a60]" : "text-gray-500"}> ({qty} шт.)</span>
                        ) : null}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={browseBuyBusy}
                          onClick={() => !browseBuyBusy && setBrowseDetailListing(null)}
                          className={
                            isL2
                              ? "flex-1 py-2.5 rounded-md border border-[#5c4a32]/55 text-[11px] text-[#a89878] hover:bg-black/25"
                              : "flex-1 py-2.5 rounded-md border border-black/50 text-[11px] text-gray-400"
                          }
                        >
                          Закрити
                        </button>
                        <button
                          type="button"
                          disabled={browseBuyBusy || qty < 1}
                          onClick={() => void onConfirmBrowseBuy()}
                          className={
                            isL2
                              ? "flex-1 py-2.5 rounded-md bg-black/35 border border-[#c7ad80]/40 text-[#e8c56e] text-[11px] font-semibold hover:brightness-110 disabled:opacity-50"
                              : "flex-1 py-2.5 rounded-md bg-amber-900/40 border border-amber-700/50 text-[#f4e2b8] text-[11px] disabled:opacity-50"
                          }
                        >
                          {browseBuyBusy ? "…" : "Купити"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
