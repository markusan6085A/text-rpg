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
import { MarketBrowseDetailModal } from "./market/MarketBrowseDetailModal";
import { MarketColSellModal } from "./market/MarketColSellModal";
import { MarketSellItemModal } from "./market/MarketSellItemModal";
import type { MarketBrowseBuyPreview } from "./market/marketBrowseTypes";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

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

  const browseBuyPreview = useMemo((): MarketBrowseBuyPreview | null => {
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
        <MarketSellItemModal
          isL2={isL2}
          row={sellModalRow}
          sellPreview={sellPreview}
          sellCurrency={sellCurrency}
          sellAmount={sellAmount}
          sellUnitPrice={sellUnitPrice}
          sellBusy={sellBusy}
          onSellAmountChange={setSellAmount}
          onSellUnitPriceChange={setSellUnitPrice}
          onSellCurrency={setSellCurrency}
          onRequestClose={() => setSellModalRow(null)}
          onConfirmListing={() => void onCreateListing()}
        />
      )}

      {colSellOpen && (
        <MarketColSellModal
          isL2={isL2}
          colSellPreview={colSellPreview}
          colSellAmount={colSellAmount}
          colSellUnit={colSellUnit}
          colSellBusy={colSellBusy}
          onColSellAmountChange={setColSellAmount}
          onColSellUnitChange={setColSellUnit}
          onRequestClose={() => setColSellOpen(false)}
          onConfirmListing={() => void onCreateColListing()}
        />
      )}

      {browseDetailListing && browseBuyPreview && hero && (
        <MarketBrowseDetailModal
          isL2={isL2}
          cid={cid}
          tick={tick}
          browseBuyBusy={browseBuyBusy}
          browseBuyQty={browseBuyQty}
          setBrowseBuyQty={setBrowseBuyQty}
          preview={browseBuyPreview}
          onRequestClose={() => setBrowseDetailListing(null)}
          onConfirmBuy={() => void onConfirmBrowseBuy()}
        />
      )}
    </div>
  );
}
