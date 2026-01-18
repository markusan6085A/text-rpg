import React from "react";

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
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
      <div
        className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">
            Підтвердження видалення
          </h2>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 text-sm mb-2">
            {amount === 1
              ? `Ви дійсно хочете видалити "${item.name}"?`
              : `Ви дійсно хочете видалити ${amount} шт. "${item.name}"?`}
          </p>
          <p className="text-red-400 text-xs italic">
            Цю дію неможливо скасувати!
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-gray-300 hover:bg-[#3a3a3a]"
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










