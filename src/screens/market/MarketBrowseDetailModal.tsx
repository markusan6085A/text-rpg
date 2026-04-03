import React from "react";
import { normalizeIconPath, handleResourceIconError, FALLBACK_ICON } from "../../utils/itemIcon";
import type { MarketBrowseBuyPreview } from "./marketBrowseTypes";
import {
  displaySellItemName,
  formatNum,
  formatPriceBi,
  formatTimeLeft,
  listingLotPriceBi,
  msLeft,
  resolveItemIconPath,
} from "./marketHelpers";

export function MarketBrowseDetailModal(props: {
  isL2: boolean;
  cid: string;
  tick: number;
  browseBuyBusy: boolean;
  browseBuyQty: string;
  setBrowseBuyQty: (v: string) => void;
  preview: MarketBrowseBuyPreview;
  onRequestClose: () => void;
  onConfirmBuy: () => void;
}) {
  const {
    isL2,
    cid,
    tick,
    browseBuyBusy,
    browseBuyQty,
    setBrowseBuyQty,
    preview,
    onRequestClose,
    onConfirmBuy,
  } = props;

  const { L, it, isColLot, lotCnt, bal, maxCan, partial, qty, pay, enchanted, itemDef } = preview;
  const own = L.sellerCharacterId === cid;
  const left = msLeft(L.expiresAt);
  void tick;
  const curLabel = L.currency === "adena" ? "аден" : "CoL";
  const lotPB = listingLotPriceBi(L);
  const perUnit = lotCnt > 1 && lotPB > 0n ? lotPB / BigInt(lotCnt) : lotPB;
  const showEquipStats = !isColLot && enchanted && (enchanted.isWeapon || enchanted.isArmor);
  const el = isColLot ? 0 : Number(enchanted?.enchantLevel ?? it.enchantLevel ?? 0);
  const {
    pAtk,
    mAtk,
    pDef,
    mDef,
    baseStats,
    isWeapon,
    isArmor,
    armorEnchantMultiplier,
    weaponPAtkEnchantFlat = 0,
    weaponMAtkEnchantFlat = 0,
  } = enchanted || {};

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(0.75rem+2cm)] bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-browse-detail-title"
      onClick={() => {
        if (!browseBuyBusy) onRequestClose();
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
            onClick={() => !browseBuyBusy && onRequestClose()}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <div className="flex gap-3 items-start">
          <img
            src={isColLot ? normalizeIconPath("/icons/col (1).png") || FALLBACK_ICON : resolveItemIconPath(it)}
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
            <div
              className={isL2 ? "text-[10px] text-[#c9a44c] mt-0.5" : "text-[10px] text-amber-300/90 mt-0.5"}
            >
              {left <= 0
                ? "Термін лоту минув"
                : lotCnt > 1
                  ? `${formatPriceBi(lotPB)} ${curLabel} за ${lotCnt} шт. (${formatPriceBi(perUnit)} за шт.) · ${formatTimeLeft(left)}`
                  : `${formatPriceBi(lotPB)} ${curLabel} · ${formatTimeLeft(left)}`}
            </div>
          </div>
        </div>

        {itemDef?.description ? (
          <p
            className={isL2 ? "text-[10px] text-[#a89878] leading-snug" : "text-[10px] text-gray-400 leading-snug"}
          >
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
            <div
              className={isL2 ? "text-[10px] text-[#c9a44c] font-semibold mb-1" : "text-[10px] text-amber-200/90 mb-1"}
            >
              Характеристики
            </div>
            {pAtk !== undefined && pAtk > 0 && (
              <div className="flex justify-between gap-2 text-[#e8dcc8]">
                <span className="text-[#8a7a60]">Фіз. атака</span>
                <span className="text-red-400">
                  {pAtk}
                  {el > 0 && isWeapon && weaponPAtkEnchantFlat > 0 && baseStats?.pAtk != null ? (
                    <span className="text-[#b8860b] ml-1">(+{weaponPAtkEnchantFlat})</span>
                  ) : null}
                </span>
              </div>
            )}
            {mAtk !== undefined && mAtk > 0 && (
              <div className="flex justify-between gap-2 text-[#e8dcc8]">
                <span className="text-[#8a7a60]">Маг. атака</span>
                <span className="text-purple-400">
                  {mAtk}
                  {el > 0 && isWeapon && weaponMAtkEnchantFlat > 0 && baseStats?.mAtk != null ? (
                    <span className="text-[#b8860b] ml-1">(+{weaponMAtkEnchantFlat})</span>
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
              onClick={() => !browseBuyBusy && onRequestClose()}
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
                onClick={() => !browseBuyBusy && onRequestClose()}
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
                onClick={() => void onConfirmBuy()}
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
      </div>
    </div>
  );
}
