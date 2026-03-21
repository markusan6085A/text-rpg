import React, { useState } from "react";
import { showToast } from "../../../state/toastStore";
import { type Clan } from "../../../utils/api";
import {
  clanModalBackdropClass,
  clanModalBtnPrimaryClass,
  clanModalBtnSecondaryClass,
  clanModalMutedClass,
  clanModalPanelClass,
  clanModalTextareaClass,
  clanModalTitleClass,
} from "./clanModalL2";

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
    <div className={clanModalBackdropClass()} onClick={onClose}>
      <div className={clanModalPanelClass("max-w-[360px] mx-auto")} onClick={(e) => e.stopPropagation()}>
        <div className={clanModalTitleClass()}>Оголошення клану</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          className={clanModalTextareaClass()}
          placeholder="Текст оголошення (до 500 символів)"
          maxLength={500}
        />
        <div className={`text-[11px] mt-1 ${clanModalMutedClass()}`}>{text.length}/500</div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleSave} disabled={saving} className={clanModalBtnPrimaryClass()}>
            Зберегти
          </button>
          <button type="button" onClick={onClose} className={clanModalBtnSecondaryClass()}>
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
