import React from "react";

interface ChatRestrictionModalProps {
  type: "mute" | "ban";
  message: string;
  timeLeftText: string;
  onClose: () => void;
}

/** Модалка "Ви отримали мут/бан" в стилі гри */
export function ChatRestrictionModal({ type, message, timeLeftText, onClose }: ChatRestrictionModalProps) {
  const title = type === "mute" ? "У вас мут" : "У вас бан чату";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-[#c7ad80]/50 bg-[#1a1a1a] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 border-b border-[#c7ad80]/30 pb-2">
          <h2 className="text-base font-bold text-[#c7ad80]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none"
            aria-label="Закрити"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-300 mb-2">{message}</p>
        <p className="text-sm text-amber-200/90 mb-4">Залишилось чекати: {timeLeftText}</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 text-sm"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}
