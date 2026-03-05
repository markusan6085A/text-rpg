import React, { useState } from "react";

interface InvitePlayerModalProps {
  playerName: string;
  onInvite: () => Promise<void>;
  onClose: () => void;
}

export default function InvitePlayerModal({ playerName, onInvite, onClose }: InvitePlayerModalProps) {
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    try {
      setLoading(true);
      await onInvite();
      onClose();
    } catch (err: any) {
      alert(err?.message || "Ошибка при приглашении");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[320px] w-full mx-4">
        <div className="text-[14px] text-[#f4e2b8] mb-3">
          Запросити <span className="text-white">{playerName}</span> в клан?
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInvite}
            disabled={loading}
            className="px-3 py-1 bg-[#5a4424] text-white text-[12px] rounded hover:bg-[#6a5434] disabled:opacity-50"
          >
            {loading ? "..." : "Запросити"}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#3a3a3a] text-white text-[12px] rounded hover:bg-[#4a4a4a]"
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
