import React from "react";
import { itemsDB } from "../../data/items/itemsDB";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface DeleteConfirmModalProps {
  item: any;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  item,
  amount,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const isL2 = getCityUiVariant() === "l2";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
      <div
        className={
          isL2
            ? "rounded-xl border border-[#c7ad80]/35 p-6 max-w-md w-full shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
            : "bg-[#14110c] border border-white/40 rounded-lg p-6 max-w-md w-full"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={isL2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
            Підтвердження видалення
          </h2>
          <button
            className={isL2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl" : "text-gray-400 hover:text-white text-xl"}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className={isL2 ? "text-[#d4c4a8] text-sm mb-2" : "text-gray-300 text-sm mb-2"}>
            {amount === 1
              ? `Ви дійсно хочете видалити "${itemsDB[item.id]?.name || item.name}"?`
              : `Ви дійсно хочете видалити ${amount} шт. "${itemsDB[item.id]?.name || item.name}"?`}
          </p>
          <p className="text-red-400 text-xs italic">
            Цю дію неможливо скасувати!
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className={
              isL2
                ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#d4c4a8] hover:border-[#c7ad80]/40"
                : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-gray-300 hover:bg-[#3a3a3a]"
            }
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}










