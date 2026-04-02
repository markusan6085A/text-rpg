import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { loadHeroFromAPI } from "../state/heroStore/heroLoadAPI";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import {
  buyMarketListingApi,
  cancelMarketListingApi,
  createMarketListingApi,
  fetchMarketListings,
  fetchMyMarketListings,
  type Character,
  type MarketListingDTO,
  type MarketCurrency,
  type MarketListingsKindFilter,
} from "../utils/api";
import type { HeroInventoryItem } from "../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { calculateEnchantedStats } from "./character/inventoryUtils";
import { normalizeIconPath, handleResourceIconError, FALLBACK_ICON } from "../utils/itemIcon";
import { showToast } from "../state/toastStore";
import {
  isCoinLuckMarketListing,
  type MarketSellPick,
  type MarketSellRow,
  itemRowId,
  pickKey,
  stackCountOfItem,
  displaySellItemName,
  resolveItemIconPath,
  formatNum,
  listingLotPriceBi,
  formatPriceBi,
  marketPartialAllowed,
  maxBuyableFromBalance,
  payForMarketQty,
  msLeft,
  formatTimeLeft,
} from "./market/marketHelpers";
import { applyMarketCharacterPatch } from "./market/applyMarketCharacterPatch";
import { L2_WARM_OUTER_FRAME } from "./location/locationL2ClassNames";

interface MarketProps {
  navigate: (path: string) => void;
}

type Tab = "browse" | "coinLuck" | "sell" | "mine";

export default function Market({ navigate }: MarketProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  /** Як у Warehouse: id з current_character_id (сервер) має пріоритет — hero.id з локалі може бути hero_* і ламає GET /market/my-listings після F5 */
  const cid = characterId || hero?.id || "";

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Outer = L2_WARM_OUTER_FRAME;

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

  const [colSellOpen, setColSellOpen] = useState(false);
  const [colSellAmount, setColSellAmount] = useState("1");
  const [colSellUnit, setColSellUnit] = useState("1");
  const [colSellBusy, setColSellBusy] = useState(false);

  const refreshBrowse = useCallback(
    async (kindOverride?: MarketListingsKindFilter) => {
      const kind: MarketListingsKindFilter =
        kindOverride ?? (tab === "coinLuck" ? "coin_luck" : "items");
      if (!kindOverride && tab !== "browse" && tab !== "coinLuck") return;
      setLoading(true);
      try {
        const res = await fetchMarketListings(page, 15, kind);
        setListings(res.listings || []);
        setTotal(res.total ?? 0);
      } catch (e: any) {
        showToast(e?.message || "Не вдалося завантажити ринок", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, tab]
  );

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
      await refreshBrowse("items");
      await refreshMine();
      setTab("mine");
    } catch (e: any) {
      showToast(e?.message || "Помилка", "error");
    } finally {
      setSellBusy(false);
    }
  };

  const colSellPreview = useMemo(() => {
    const max = Math.max(0, Math.floor(Number(hero?.coinOfLuck ?? 0)));
    const unit = Math.floor(Number(String(colSellUnit).replace(/\s/g, "")) || 0);
    const amt = Math.floor(Number(String(colSellAmount).replace(/\s/g, "")) || 0);
    const lotTotal = unit * amt;
    return { max, unit, amt, lotTotal };
  }, [hero?.coinOfLuck, colSellUnit, colSellAmount]);

  const onCreateColListing = async () => {
    if (!cid) return;
    const { max, unit, amt, lotTotal } = colSellPreview;
    if (!Number.isFinite(unit) || unit < 1) {
      showToast("Ціна за 1 CoL (адена) ≥ 1", "info");
      return;
    }
    if (!Number.isFinite(amt) || amt < 1 || amt > max) {
      showToast(`Кількість CoL від 1 до ${max}`, "info");
      return;
    }
    if (!Number.isFinite(lotTotal) || lotTotal < 1 || lotTotal > Number.MAX_SAFE_INTEGER) {
      showToast("Занадто велика сума", "info");
      return;
    }
    setColSellBusy(true);
    try {
      const res = await createMarketListingApi(cid, {
        listingKind: "coin_luck",
        currency: "adena",
        unitPrice: unit,
        amount: amt,
      });
      showToast("Лот Coin of Luck виставлено (24 год)", "success");
      setColSellOpen(false);
      setColSellUnit("1");
      setColSellAmount("1");
      await syncHeroAfterMarket(res.character);
      await refreshBrowse("coin_luck");
      await refreshMine();
      setTab("mine");
    } catch (e: any) {
      showToast(e?.message || "Помилка", "error");
    } finally {
      setColSellBusy(false);
    }
  };

  const openBrowseDetail = (L: MarketListingDTO) => {
    const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
    const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
    const bal =
      L.currency === "adena" ? Number(hero?.adena ?? 0) : Number(hero?.coinOfLuck ?? 0);
    const maxCan = maxBuyableFromBalance(listingLotPriceBi(L), lotCnt, bal);
    setBrowseDetailListing(L);
    setBrowseBuyQty(String(maxCan > 0 ? maxCan : 1));
  };

  const browseBuyPreview = useMemo(() => {
    const L = browseDetailListing;
    if (!L || !hero) return null;
    const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
    const isColLot = isCoinLuckMarketListing(L);
    const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
    const bal =
      L.currency === "adena" ? Number(hero.adena ?? 0) : Number(hero.coinOfLuck ?? 0);
    const lotTotalBi = listingLotPriceBi(L);
    const maxCan = maxBuyableFromBalance(lotTotalBi, lotCnt, bal);
    const partial = marketPartialAllowed(lotTotalBi, lotCnt);
    const rawQ = Math.floor(Number(String(browseBuyQty).replace(/\s/g, "")) || 0);
    const qtyMaxPartial = Math.min(lotCnt, Math.max(0, maxCan));
    let qty = 0;
    if (partial) {
      qty =
        qtyMaxPartial <= 0 ? 0 : Math.min(qtyMaxPartial, Math.max(1, rawQ || 1));
    } else {
      qty = maxCan > 0 ? lotCnt : 0;
    }
    const pay = qty > 0 ? payForMarketQty(lotTotalBi, lotCnt, qty) : 0n;
    const rowId = isColLot
      ? "coin_of_luck"
      : itemRowId(it) || String((it as { id?: string }).id || "").trim();
    const itemForStats =
      !isColLot && rowId ? ({ ...it, id: rowId } as HeroInventoryItem & { itemId?: string }) : null;
    const enchanted = itemForStats ? calculateEnchantedStats(itemForStats) : null;
    const itemDef = rowId ? itemsDBWithStarter[rowId] || itemsDB[rowId] : undefined;
    return {
      L,
      it,
      isColLot,
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
    if (!marketPartialAllowed(listingLotPriceBi(L), lotCnt) && qty !== lotCnt) {
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
    const wasCol = myListings.find((x) => x.id === listingId);
    const colLot = wasCol && isCoinLuckMarketListing(wasCol);
    setCancelBusyId(listingId);
    try {
      const res = await cancelMarketListingApi(listingId, cid);
      showToast(colLot ? "Лот знято, Coin of Luck повернуто на баланс" : "Лот знято, предмет повернуто", "success");
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

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === "browse" || t === "coinLuck") setPage(1);
  };

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => goTab(t)}
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

  /** Вкладка «Виставити»: вдвічі нижчі рядки за рахунок padding та меншої іконки */
  const sellPickRow = isL2
    ? "flex gap-2 items-center py-1 px-2 rounded-md border border-[#5c4a32]/50 bg-gradient-to-b from-[#2a2318]/92 to-[#12100c]/92 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
    : "flex gap-2 items-center py-1 px-2 rounded-md border border-black/55 bg-[#1a1510]";

  /** Компактний рядок у списках лотів (огляд / мої лоти): нижча рамка, іконка 20×20 */
  const listingRowCompact = isL2
    ? "flex gap-2 items-center py-1.5 px-2 rounded-md border border-[#5c4a32]/50 bg-gradient-to-b from-[#2a2318]/92 to-[#12100c]/92 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
    : "flex gap-2 items-center py-1.5 px-2 rounded-md border border-black/55 bg-[#1a1510]";

  const marketStallBox = isL2
    ? "rounded-lg border border-[#6b5a40]/50 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(90,70,40,0.16)_0%,transparent_55%),linear-gradient(180deg,rgba(28,24,18,0.96)_0%,rgba(6,5,4,0.99)_100%)] shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] overflow-hidden"
    : "";

  const renderMineListingRow = (L: MarketListingDTO) => {
    const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
    const isCol = isCoinLuckMarketListing(L);
    const left = msLeft(L.expiresAt);
    void tick;
    const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
    const lotTotal = listingLotPriceBi(L);
    const perUnit = lotCnt > 1 && lotTotal > 0n ? lotTotal / BigInt(lotCnt) : lotTotal;
    const curLabel = L.currency === "adena" ? "аден" : "CoL";
    return (
      <div key={L.id} className={listingRowCompact}>
        <img
          src={isCol ? normalizeIconPath("/icons/col (1).png") || FALLBACK_ICON : resolveItemIconPath(it)}
          alt=""
          className="w-5 h-5 object-contain rounded border border-[#5c4a32]/35 bg-black/35 shrink-0"
          onError={handleResourceIconError}
        />
        <div className="flex-1 min-w-0">
          <div
            className={
              isL2
                ? "text-[11px] leading-snug text-[#e8dcc8] truncate"
                : "text-[11px] leading-snug text-amber-100 truncate"
            }
          >
            <span className="font-semibold">{displaySellItemName(it)}</span>
            {it?.count && Number(it.count) > 1 ? <span className="font-semibold"> ×{it.count}</span> : null}
            <span className={isL2 ? "text-[#5c5248] font-normal" : "text-gray-600 font-normal"}> · </span>
            <span className={isL2 ? "text-[#8a7a60] font-normal" : "text-gray-500 font-normal"}>Продавець: </span>
            <span className={isL2 ? "text-[#b8a88c] font-medium" : "text-amber-200/85 font-medium"}>
              {L.sellerName}
            </span>
          </div>
          <div className={isL2 ? "text-[9px] text-[#c9a44c] mt-0.5 leading-tight" : "text-[9px] text-amber-300 mt-0.5 leading-tight"}>
            {lotCnt > 1
              ? `${formatPriceBi(lotTotal)} ${curLabel} за ${lotCnt} шт. (${formatPriceBi(perUnit)} за шт.) · ${formatTimeLeft(left)}`
              : `${formatPriceBi(lotTotal)} ${curLabel} · ${formatTimeLeft(left)}`}
          </div>
        </div>
        <button
          type="button"
          disabled={cancelBusyId === L.id}
          onClick={() => void onCancel(L.id)}
          className="text-[9px] px-1.5 py-1 rounded border border-[#9d6b6b]/55 text-[#e8b4b4] shrink-0 leading-tight"
        >
          {cancelBusyId === L.id ? "…" : "Снять"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-stretch px-2 py-4 max-w-xl mx-auto w-full min-w-0">
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
          <p className={isL2 ? "text-[10px] text-[#8a7a60] leading-snug" : "text-[10px] text-[#a89878]"}>
            «Все лоты» — предмети. «Coin of Luck» — CoL з балансу, оплата аденою. Лот 24 год.
          </p>

          <div
            className={
              isL2
                ? "rounded-lg border border-[#5c4a32]/45 bg-black/22 p-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.05)]"
                : ""
            }
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {tabBtn("browse", "Все лоты")}
              {tabBtn("coinLuck", "Coin of Luck")}
              {tabBtn("sell", "Выставить")}
              {tabBtn("mine", "Мои лоты")}
            </div>
          </div>

          {isL2 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-[#5c4a32]/50 bg-gradient-to-b from-[#241e14]/95 to-black/50 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]">
                <div className="text-[8px] uppercase tracking-wider text-[#8a7a60]">Адена</div>
                <div className="text-[12px] font-semibold tabular-nums text-[#e8c56e] leading-tight">
                  {formatNum(hero.adena ?? 0)}
                </div>
              </div>
              <div className="rounded-md border border-[#5c4a32]/50 bg-gradient-to-b from-[#241e14]/95 to-black/50 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]">
                <div className="text-[8px] uppercase tracking-wider text-[#8a7a60]">Coin of Luck</div>
                <div className="text-[12px] font-semibold tabular-nums text-[#d4c4a8] leading-tight">
                  {formatNum(hero.coinOfLuck ?? 0)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-[11px] text-amber-200/80">
              <span>Адена: {formatNum(hero.adena ?? 0)}</span>
              <span>CoL: {formatNum(hero.coinOfLuck ?? 0)}</span>
            </div>
          )}
        </div>

        {(tab === "browse" || tab === "coinLuck") && (
          <div className="px-3 pb-4 space-y-2">
            {tab === "coinLuck" ? (
              <div className="space-y-2">
                <p className={isL2 ? "text-[11px] text-[#a89878]" : "text-[11px] text-gray-400"}>
                  Тут лише лоти Coin of Luck: продавець виставляє кількість CoL з балансу, покупець платить{" "}
                  <strong>аденою</strong>. Після покупки CoL зараховується на баланс одержувача.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const m = Math.max(0, Math.floor(Number(hero.coinOfLuck ?? 0)));
                    setColSellAmount(m > 0 ? String(m) : "1");
                    setColSellUnit("1");
                    setColSellOpen(true);
                  }}
                  className={
                    isL2
                      ? "w-full py-2 rounded-md border border-[#c7ad80]/45 text-[11px] text-[#e8c56e] bg-black/30 hover:bg-black/45"
                      : "w-full py-2 rounded-md border border-amber-700/50 text-[11px] text-amber-100 bg-amber-950/40"
                  }
                >
                  Виставити Coin of Luck
                </button>
              </div>
            ) : null}
            <div className={isL2 ? marketStallBox : "space-y-2"}>
              {isL2 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 border-b border-[#4a3f2e]/55 bg-black/28">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c9a44c]">
                    {tab === "coinLuck" ? "CoL на біржі" : "Вітрина лотів"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-[#8a7a60]">
                      Всього: <span className="text-[#d4c4a8] font-medium tabular-nums">{total}</span>
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void refreshBrowse()}
                      className="text-[10px] px-2 py-1 rounded border border-[#7a6a48]/55 text-[#e8c56e] bg-black/25 hover:bg-black/40 disabled:opacity-50"
                    >
                      {loading ? "…" : "Обновить"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-gray-500">Всього: {total}</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void refreshBrowse()}
                    className="text-[10px] px-2 py-1 rounded border border-black/50 text-amber-200"
                  >
                    {loading ? "…" : "Обновить"}
                  </button>
                </div>
              )}
              <div className={isL2 ? "px-1.5 py-1.5 space-y-1" : "space-y-2"}>
                {listings.length === 0 && !loading ? (
                  <p
                    className={
                      isL2
                        ? "text-center text-[12px] text-[#8a7a60] py-7 px-2 rounded-md border border-dashed border-[#5c4a32]/35 bg-black/20"
                        : "text-center text-sm text-gray-500 py-6"
                    }
                  >
                    Немає активних лотів
                  </p>
                ) : (
                  listings.map((L) => {
                    const it = L.itemSnapshot as HeroInventoryItem & { itemId?: string };
                    const isCol = isCoinLuckMarketListing(L);
                    const icon = isCol
                      ? normalizeIconPath("/icons/col (1).png") || FALLBACK_ICON
                      : resolveItemIconPath(it);
                    const own = L.sellerCharacterId === cid;
                    const left = msLeft(L.expiresAt);
                    void tick;
                    const lotCnt = Math.max(1, Math.floor(Number(it?.count) || 1));
                    const lotTotal = listingLotPriceBi(L);
                    const perUnit =
                      lotCnt > 1 && lotTotal > 0n ? lotTotal / BigInt(lotCnt) : lotTotal;
                    const curLabel = L.currency === "adena" ? "аден" : "CoL";
                    return (
                      <button
                        key={L.id}
                        type="button"
                        onClick={() => openBrowseDetail(L)}
                        className={`${listingRowCompact} w-full text-left cursor-pointer hover:brightness-[1.03] active:brightness-95 transition-[filter] ${
                          isL2 ? "hover:border-[#8a7348]/45" : ""
                        }`}
                      >
                        <img
                          src={icon}
                          alt=""
                          className="w-5 h-5 object-contain rounded border border-[#5c4a32]/35 bg-black/35 shrink-0 pointer-events-none"
                          onError={handleResourceIconError}
                        />
                        <div className="flex-1 min-w-0 pointer-events-none">
                          <div
                            className={
                              isL2
                                ? "text-[11px] leading-snug text-[#e8dcc8] truncate"
                                : "text-[11px] leading-snug text-amber-100 truncate"
                            }
                          >
                            <span className="font-semibold">{displaySellItemName(it)}</span>
                            {it?.count && Number(it.count) > 1 ? (
                              <span className="font-semibold"> ×{it.count}</span>
                            ) : null}
                            <span className={isL2 ? "text-[#5c5248] font-normal" : "text-gray-600 font-normal"}> · </span>
                            <span className={isL2 ? "text-[#8a7a60] font-normal" : "text-gray-500 font-normal"}>
                              Продавець:{" "}
                            </span>
                            <span className={isL2 ? "text-[#b8a88c] font-medium" : "text-amber-200/85 font-medium"}>
                              {L.sellerName}
                            </span>
                            {own ? (
                              <span className={isL2 ? "text-[#6a5a48] font-normal ml-1" : "text-gray-500 font-normal ml-1"}>
                                (ваш)
                              </span>
                            ) : null}
                          </div>
                          <div className={isL2 ? "text-[9px] text-[#c9a44c] mt-0.5 leading-tight" : "text-[9px] text-amber-300/90 mt-0.5 leading-tight"}>
                            {left <= 0 ? (
                              <span className="text-[#9d6b6b]">Час вичерпано</span>
                            ) : lotCnt > 1 ? (
                              `${formatPriceBi(lotTotal)} ${curLabel} за ${lotCnt} шт. (${formatPriceBi(perUnit)} за шт.) · ${formatTimeLeft(left)}`
                            ) : (
                              `${formatPriceBi(lotTotal)} ${curLabel} · ${formatTimeLeft(left)}`
                            )}
                          </div>
                        </div>
                        <span
                          className={
                            isL2
                              ? "text-[9px] text-[#8a7a60] shrink-0 self-center"
                              : "text-[9px] text-gray-500 shrink-0 self-center"
                          }
                        >
                          →
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              {total > 15 && (
                <div
                  className={
                    isL2
                      ? "flex justify-center gap-2 px-2 py-2.5 border-t border-[#4a3f2e]/50 bg-black/22"
                      : "flex justify-center gap-2 pt-2"
                  }
                >
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="text-[10px] px-2 py-1 rounded border border-[#5c4a32]/50 text-[#d4c4a8] disabled:opacity-40"
                  >
                    Назад
                  </button>
                  <span className="text-[10px] text-[#8a7a60] self-center tabular-nums">{page}</span>
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
                          className={`${sellPickRow} w-full text-left opacity-90 hover:opacity-100`}
                        >
                        <img
                          src={resolveItemIconPath(it)}
                          alt=""
                          className="w-6 h-6 shrink-0 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                          onError={handleResourceIconError}
                        />
                          <div className="min-w-0 flex-1">
                            <div className={isL2 ? "text-[11px] leading-tight text-[#e8dcc8] truncate" : "text-xs truncate"}>
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
                          className={`${sellPickRow} w-full text-left opacity-90 hover:opacity-100`}
                        >
                        <img
                          src={resolveItemIconPath(it)}
                          alt=""
                          className="w-6 h-6 shrink-0 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                          onError={handleResourceIconError}
                        />
                          <div className="min-w-0 flex-1">
                            <div className={isL2 ? "text-[11px] leading-tight text-[#e8dcc8] truncate" : "text-xs truncate"}>
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
            {isL2 ? (
              <div className={marketStallBox}>
                <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 border-b border-[#4a3f2e]/55 bg-black/28">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c9a44c]">Мої лоти</span>
                  <button
                    type="button"
                    onClick={() => void refreshMine()}
                    className="text-[10px] px-2 py-1 rounded border border-[#7a6a48]/55 text-[#e8c56e] bg-black/25 hover:bg-black/40"
                  >
                    Обновить список
                  </button>
                </div>
                <div className="px-1.5 py-1.5 space-y-1">
                  {myListings.length === 0 ? (
                    <p className="text-center text-[12px] text-[#8a7a60] py-7 px-2 rounded-md border border-dashed border-[#5c4a32]/35 bg-black/20">
                      У вас немає активних лотів
                    </p>
                  ) : (
                    myListings.map(renderMineListingRow)
                  )}
                </div>
              </div>
            ) : (
              <>
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
                  myListings.map(renderMineListingRow)
                )}
              </>
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
                src={resolveItemIconPath(sellModalRow.item)}
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

      {colSellOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(0.75rem+2cm)] bg-black/75"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!colSellBusy) setColSellOpen(false);
          }}
        >
          <div
            className={
              isL2
                ? "w-full max-w-sm rounded-xl border border-[#c7ad80]/45 shadow-[0_16px_48px_rgba(0,0,0,0.75)] bg-[linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)] p-4 space-y-3"
                : "w-full max-w-sm rounded-xl border border-amber-800/50 bg-[#1a1510] p-4 space-y-3"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className={isL2 ? "text-center text-[13px] font-semibold text-[#e8c56e]" : "text-center text-sm font-semibold text-amber-100"}>
              Виставити Coin of Luck
            </div>
            <p className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-500"}>
              З балансу героя (не з інвентаря). Ціна — адена за 1 CoL. Покупець платить аденою, отримує CoL на баланс.
            </p>
            <div className="flex gap-2 items-center">
              <img
                src={normalizeIconPath("/icons/col (1).png") || ""}
                alt=""
                className="w-11 h-11 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                onError={handleResourceIconError}
              />
              <div className={isL2 ? "text-[11px] text-[#c9a44c]" : "text-[11px] text-amber-200"}>
                Доступно: <strong>{formatNum(colSellPreview.max)}</strong> CoL
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>Кількість CoL</label>
              <input
                type="text"
                inputMode="numeric"
                value={colSellAmount}
                onChange={(e) => setColSellAmount(e.target.value.replace(/[^\d]/g, ""))}
                className={
                  isL2
                    ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                    : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>
                Ціна за 1 CoL (адена)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={colSellUnit}
                onChange={(e) => setColSellUnit(e.target.value.replace(/[^\d]/g, ""))}
                className={
                  isL2
                    ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                    : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
                }
              />
            </div>
            <div className={isL2 ? "text-[11px] text-[#c9a44c] text-center" : "text-[11px] text-amber-200/90 text-center"}>
              Покупець заплатить:{" "}
              <span className="font-semibold">{formatNum(colSellPreview.lotTotal)} аден</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={colSellBusy}
                onClick={() => !colSellBusy && setColSellOpen(false)}
                className={
                  isL2
                    ? "flex-1 py-2.5 rounded-md border border-[#5c4a32]/55 text-[11px] text-[#a89878]"
                    : "flex-1 py-2.5 rounded-md border border-black/50 text-[11px] text-gray-400"
                }
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={colSellBusy || colSellPreview.max < 1}
                onClick={() => void onCreateColListing()}
                className={
                  isL2
                    ? "flex-1 py-2.5 rounded-md bg-black/35 border border-[#c7ad80]/40 text-[#e8c56e] text-[11px] font-semibold disabled:opacity-50"
                    : "flex-1 py-2.5 rounded-md bg-amber-900/40 border border-amber-700/50 text-[#f4e2b8] text-[11px] disabled:opacity-50"
                }
              >
                {colSellBusy ? "…" : "Выставить"}
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
              const { L, it, isColLot, lotCnt, bal, maxCan, partial, qty, pay, enchanted, itemDef } =
                browseBuyPreview;
              const own = L.sellerCharacterId === cid;
              const left = msLeft(L.expiresAt);
              void tick;
              const curLabel = L.currency === "adena" ? "аден" : "CoL";
              const lotPB = listingLotPriceBi(L);
              const perUnit = lotCnt > 1 && lotPB > 0n ? lotPB / BigInt(lotCnt) : lotPB;
              const showEquipStats =
                !isColLot && enchanted && (enchanted.isWeapon || enchanted.isArmor);
              const el = isColLot
                ? 0
                : Number(enchanted?.enchantLevel ?? it.enchantLevel ?? 0);
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
                      {isColLot ? "Coin of Luck" : "Лот на ринку"}
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
                        isColLot
                          ? normalizeIconPath("/icons/col (1).png") || FALLBACK_ICON
                          : resolveItemIconPath(it)
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
                        {!isColLot && el > 0 ? ` +${el}` : ""}
                        {lotCnt > 1 ? ` ×${lotCnt}` : ""}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#8a7a60] mt-1" : "text-[10px] text-gray-500 mt-1"}>
                        Продавець: {L.sellerName}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#c9a44c] mt-0.5" : "text-[10px] text-amber-300/90 mt-0.5"}>
                        {left <= 0
                          ? "Термін лоту минув"
                          : lotCnt > 1
                            ? `${formatPriceBi(lotPB)} ${curLabel} за ${lotCnt} шт. (${formatPriceBi(perUnit)} за шт.) · ${formatTimeLeft(left)}`
                            : `${formatPriceBi(lotPB)} ${curLabel} · ${formatTimeLeft(left)}`}
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
                          {formatPriceBi(pay)} {curLabel}
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
