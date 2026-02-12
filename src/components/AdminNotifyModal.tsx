import React from "react";

interface AdminNotifyModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

/** Маленька модалка в стилі адмінки: повідомлення про мут/бан/розбан тощо */
export function AdminNotifyModal({ title, message, onClose }: AdminNotifyModalProps) {
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
        <p className="text-sm text-gray-300 mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
