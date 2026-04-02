import React from "react";
import { normalizeIconPath, handleResourceIconError } from "../../utils/itemIcon";
import type { MarketSellPreviewTotals } from "./MarketSellItemModal";
import { formatNum } from "./marketHelpers";

export function MarketColSellModal(props: {
  isL2: boolean;
  colSellPreview: MarketSellPreviewTotals;
  colSellAmount: string;
  colSellUnit: string;
  colSellBusy: boolean;
  onColSellAmountChange: (v: string) => void;
  onColSellUnitChange: (v: string) => void;
  onRequestClose: () => void;
  onConfirmListing: () => void;
}) {
  const {
    isL2,
    colSellPreview,
    colSellAmount,
    colSellUnit,
    colSellBusy,
    onColSellAmountChange,
    onColSellUnitChange,
    onRequestClose,
    onConfirmListing,
  } = props;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(0.75rem+2cm)] bg-black/75"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!colSellBusy) onRequestClose();
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
        <div
          className={
            isL2
              ? "text-center text-[13px] font-semibold text-[#e8c56e]"
              : "text-center text-sm font-semibold text-amber-100"
          }
        >
          Виставити Coin of Luck
        </div>
        <p className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-500"}>
          З балансу героя (не з інвентаря). Ціна — адена за 1 CoL. Покупець платить аденою, отримує CoL на
          баланс.
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
          <label className={isL2 ? "text-[10px] text-[#a89878]" : "text-[10px] text-gray-400"}>
            Кількість CoL
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={colSellAmount}
            onChange={(e) => onColSellAmountChange(e.target.value.replace(/[^\d]/g, ""))}
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
            onChange={(e) => onColSellUnitChange(e.target.value.replace(/[^\d]/g, ""))}
            className={
              isL2
                ? "w-full rounded-md bg-black/40 border border-[#5c4a32]/55 px-3 py-2 text-[13px] text-[#e8dcc8]"
                : "w-full rounded-md bg-black/50 border border-black/60 px-3 py-2 text-sm text-amber-100"
            }
          />
        </div>
        <div
          className={
            isL2 ? "text-[11px] text-[#c9a44c] text-center" : "text-[11px] text-amber-200/90 text-center"
          }
        >
          Покупець заплатить:{" "}
          <span className="font-semibold">{formatNum(colSellPreview.lotTotal)} аден</span>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={colSellBusy}
            onClick={() => !colSellBusy && onRequestClose()}
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
            onClick={() => void onConfirmListing()}
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
  );
}
