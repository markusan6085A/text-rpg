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
import { normalizeIconPath, handleResourceIconError } from "../utils/itemIcon";
import { showToast } from "../state/toastStore";

interface MarketProps {
  navigate: (path: string) => void;
}

type Tab = "browse" | "sell" | "mine";

const formatNum = (n: number) =>
  n.toLocaleString("ru-RU").replace(/\s/g, ".");

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
  store.updateHero(
    {
      adena,
      coinOfLuck: col,
      inventory: inv as HeroInventoryItem[],
      overflowChest: overflow as HeroInventoryItem[] | undefined,
      heroJson: {
        ...(hero as any).heroJson,
        ...hj,
        inventory: inv,
        overflowChest: overflow,
        adena,
        coinOfLuck: col,
      },
    } as any,
    { persist: true }
  );
  store.updateServerState({ coinLuck: col, updatedAt: Date.now() });
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

  const [sellItemId, setSellItemId] = useState<string | null>(null);
  const [sellCurrency, setSellCurrency] = useState<MarketCurrency>("adena");
  const [sellPrice, setSellPrice] = useState<string>("1");
  const [sellBusy, setSellBusy] = useState(false);

  const [buyBusyId, setBuyBusyId] = useState<string | null>(null);
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

  const sellableInventory = useMemo(() => {
    if (!hero?.inventory) return [];
    return hero.inventory.filter((it) => {
      if (!it?.id) return false;
      if (it.id === "overflow_chest") return false;
      if (equippedIds.has(it.id)) return false;
      return true;
    });
  }, [hero?.inventory, equippedIds]);

  const selectedSellItem: HeroInventoryItem | undefined = useMemo(
    () => sellableInventory.find((i) => i.id === sellItemId),
    [sellableInventory, sellItemId]
  );

  const syncHeroAfterMarket = async (c: Character) => {
    applyMarketCharacterPatch(c);
    const h = await loadHeroFromAPI();
    if (h) useHeroStore.getState().setHero(h);
  };

  const onCreateListing = async () => {
    if (!cid || !sellItemId) {
      showToast("Оберіть предмет", "info");
      return;
    }
    const price = Math.floor(Number(sellPrice.replace(/\s/g, "")));
    if (!Number.isFinite(price) || price < 1) {
      showToast("Вкажіть ціну ≥ 1", "info");
      return;
    }
    setSellBusy(true);
    try {
      const res = await createMarketListingApi(cid, {
        inventoryItemId: sellItemId,
        currency: sellCurrency,
        price,
      });
      showToast("Лот виставлено (24 год)", "success");
      setSellItemId(null);
      setSellPrice("1");
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

  const onBuy = async (listing: MarketListingDTO) => {
    if (!cid) return;
    if (listing.sellerCharacterId === cid) return;
    setBuyBusyId(listing.id);
    try {
      const res = await buyMarketListingApi(listing.id, cid);
      showToast("Куплено", "success");
      await syncHeroAfterMarket(res.buyer);
      await refreshBrowse();
      await refreshMine();
    } catch (e: any) {
      showToast(e?.message || "Не вдалося купити", "error");
    } finally {
      setBuyBusyId(null);
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
                const it = L.itemSnapshot as HeroInventoryItem;
                const icon = normalizeIconPath(it?.icon);
                const own = L.sellerCharacterId === cid;
                const left = msLeft(L.expiresAt);
                void tick;
                return (
                  <div key={L.id} className={cardRow}>
                    <img
                      src={icon || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                      alt=""
                      className="w-10 h-10 object-contain rounded border border-[#5c4a32]/40 bg-black/40 shrink-0"
                      onError={handleResourceIconError}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={isL2 ? "text-[12px] font-semibold text-[#e8dcc8] truncate" : "text-sm text-amber-100 truncate"}>
                        {it?.name || "Предмет"}
                        {it?.count && it.count > 1 ? ` ×${it.count}` : ""}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-500"}>
                        Продавець: {L.sellerName}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#c9a44c] mt-0.5" : "text-[10px] text-amber-300/90 mt-0.5"}>
                        {L.currency === "adena" ? `${formatNum(L.price)} аден` : `${formatNum(L.price)} CoL`} ·{" "}
                        {formatTimeLeft(left)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={own || buyBusyId === L.id || left <= 0}
                      onClick={() => void onBuy(L)}
                      className={
                        own
                          ? "text-[10px] px-2 py-1.5 rounded-md border border-[#5c4a32]/40 text-[#6a5a48] shrink-0 cursor-not-allowed"
                          : isL2
                            ? "text-[10px] px-2 py-1.5 rounded-md border border-[#7d9b7a]/55 text-[#b8d4b0] hover:brightness-110 shrink-0 disabled:opacity-40"
                            : "text-[10px] px-2 py-1.5 rounded-md border border-green-700/50 text-green-200 shrink-0"
                      }
                    >
                      {own ? "Ваш" : buyBusyId === L.id ? "…" : "Купить"}
                    </button>
                  </div>
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
              Оберіть предмет з інвентаря (не в екіпіровці). Ціна в аденах або в Coin of Luck.
            </p>
            <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
              {sellableInventory.length === 0 ? (
                <p className="text-[12px] text-[#8a7a60] text-center py-4">Немає предметів для продажу</p>
              ) : (
                sellableInventory.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setSellItemId(it.id)}
                    className={
                      sellItemId === it.id
                        ? `${cardRow} w-full text-left ring-1 ring-[#c7ad80]/40`
                        : `${cardRow} w-full text-left opacity-90 hover:opacity-100`
                    }
                  >
                    <img
                      src={normalizeIconPath(it.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                      alt=""
                      className="w-9 h-9 object-contain rounded border border-[#5c4a32]/40 bg-black/40"
                      onError={handleResourceIconError}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={isL2 ? "text-[12px] text-[#e8dcc8] truncate" : "text-sm truncate"}>
                        {it.name}
                        {it.count && it.count > 1 ? ` ×${it.count}` : ""}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            {selectedSellItem && (
              <div className="space-y-2 border-t border-[#5c4a32]/35 pt-3">
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
                <input
                  type="text"
                  inputMode="numeric"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Ціна"
                  className={
                    isL2
                      ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                      : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
                  }
                />
                <button
                  type="button"
                  disabled={sellBusy}
                  onClick={() => void onCreateListing()}
                  className={
                    isL2
                      ? "w-full py-2.5 rounded-md bg-black/35 border border-[#c7ad80]/40 text-[#e8c56e] text-[12px] font-semibold hover:brightness-110 disabled:opacity-50"
                      : "w-full py-2.5 rounded-md bg-amber-900/40 border border-amber-700/50 text-[#f4e2b8] text-sm disabled:opacity-50"
                  }
                >
                  {sellBusy ? "…" : "Выставить на продажу (24 ч)"}
                </button>
              </div>
            )}
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
                const it = L.itemSnapshot as HeroInventoryItem;
                const left = msLeft(L.expiresAt);
                void tick;
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
                        {it?.name || "Предмет"}
                      </div>
                      <div className={isL2 ? "text-[10px] text-[#c9a44c]" : "text-[10px] text-amber-300"}>
                        {L.currency === "adena" ? `${formatNum(L.price)} аден` : `${formatNum(L.price)} CoL`} ·{" "}
                        {formatTimeLeft(left)}
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
    </div>
  );
}
