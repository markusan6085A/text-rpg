import React from "react";
import type { MarketCurrency } from "../../utils/api";
import { handleResourceIconError } from "../../utils/itemIcon";
import type { MarketSellRow } from "./marketHelpers";
import {
  displaySellItemName,
  formatNum,
  resolveItemIconPath,
} from "./marketHelpers";

export interface MarketSellPreviewTotals {
  max: number;
  unit: number;
  amt: number;
  lotTotal: number;
}

export function MarketSellItemModal(props: {
  isL2: boolean;
  row: MarketSellRow;
  sellPreview: MarketSellPreviewTotals;
  sellCurrency: MarketCurrency;
  sellAmount: string;
  sellUnitPrice: string;
  sellBusy: boolean;
  onSellAmountChange: (v: string) => void;
  onSellUnitPriceChange: (v: string) => void;
  onSellCurrency: (c: MarketCurrency) => void;
  onRequestClose: () => void;
  onConfirmListing: () => void;
}) {
  const {
    isL2,
    row,
    sellPreview,
    sellCurrency,
    sellAmount,
    sellUnitPrice,
    sellBusy,
    onSellAmountChange,
    onSellUnitPriceChange,
    onSellCurrency,
    onRequestClose,
    onConfirmListing,
  } = props;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(0.75rem+2cm)] bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-sell-title"
      onClick={() => {
        if (!sellBusy) onRequestClose();
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
        <div
          id="market-sell-title"
          className={
            isL2
              ? "text-center text-[13px] font-semibold text-[#e8c56e]"
              : "text-center text-sm font-semibold text-amber-100"
          }
        >
          Виставити на ринок
        </div>
        <div className="flex gap-3 items-center">
          <img
            src={resolveItemIconPath(row.item)}
            alt=""
            className="w-12 h-12 object-contain rounded border border-[#5c4a32]/40 bg-black/40 shrink-0"
            onError={handleResourceIconError}
          />
          <div className="min-w-0 flex-1">
            <div
              className={
                isL2
                  ? "text-[12px] text-[#e8dcc8] font-medium truncate"
                  : "text-sm text-amber-50 truncate"
              }
            >
              {displaySellItemName(row.item)}
            </div>
            <div
              className={
                isL2 ? "text-[10px] text-[#8a7a60] mt-0.5" : "text-[10px] text-gray-500 mt-0.5"
              }
            >
              У вас: {sellPreview.max} шт.
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>
            Кількість
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={sellAmount}
            onChange={(e) => onSellAmountChange(e.target.value.replace(/[^\d]/g, ""))}
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
            onChange={(e) => onSellUnitPriceChange(e.target.value.replace(/[^\d]/g, ""))}
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
            onClick={() => onSellCurrency("adena")}
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
            onClick={() => onSellCurrency("coinLuck")}
            className={
              sellCurrency === "coinLuck"
                ? "text-[11px] px-3 py-1 rounded-full border border-[#c7ad80]/50 text-[#e8c56e]"
                : "text-[11px] px-3 py-1 rounded-full border border-[#5c4a32]/40 text-[#8a7a60]"
            }
          >
            Coin of Luck
          </button>
        </div>

        <div
          className={
            isL2
              ? "text-[11px] text-[#c9a44c] text-center"
              : "text-[11px] text-amber-200/90 text-center"
          }
        >
          Покупець заплатить:{" "}
          <span className="font-semibold">
            {sellCurrency === "adena"
              ? `${formatNum(sellPreview.lotTotal)} аден`
              : `${formatNum(sellPreview.lotTotal)} CoL`}
          </span>
          {sellPreview.max > 1 && sellPreview.unit > 0 && sellPreview.amt > 0 ? (
            <span className="text-[#8a7a60]">
              {" "}
              ({sellPreview.amt}×{formatNum(sellPreview.unit)})
            </span>
          ) : null}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={sellBusy}
            onClick={() => !sellBusy && onRequestClose()}
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
            onClick={() => void onConfirmListing()}
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
  );
}
