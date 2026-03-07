import React, { useState } from "react";
import { showToast } from "../../../state/toastStore";
import { type Clan } from "../../../utils/api";

interface ClanAnnouncementModalProps {
  clan: Clan;
  onSave: (announcement: string) => Promise<void>;
  onClose: () => void;
}

export default function ClanAnnouncementModal({ clan, onSave, onClose }: ClanAnnouncementModalProps) {
  const [text, setText] = useState(clan.announcement || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(text);
      onClose();
    } catch (err: any) {
      showToast(err?.message || "Ошибка при сохранении", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[360px] w-full mx-4">
        <div className="text-[14px] text-[#f4e2b8] mb-3">Оголошення клану</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          className="w-full h-24 px-2 py-1 bg-[#2a2a2a] border border-white/40 text-white text-[12px] rounded resize-none"
          placeholder="Текст оголошення (до 500 символів)"
          maxLength={500}
        />
        <div className="text-[11px] text-[#9f8d73] mt-1">{text.length}/500</div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-[#5a4424] text-white text-[12px] rounded hover:bg-[#6a5434] disabled:opacity-50"
          >
            Зберегти
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
