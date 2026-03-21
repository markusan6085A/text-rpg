import React, { useState } from "react";
import { showToast } from "../../../state/toastStore";
import {
  clanModalBackdropClass,
  clanModalBtnPrimaryClass,
  clanModalBtnSecondaryClass,
  clanModalIsL2,
  clanModalPanelClass,
} from "./clanModalL2";

interface InvitePlayerModalProps {
  playerName: string;
  onInvite: () => Promise<void>;
  onClose: () => void;
}

export default function InvitePlayerModal({ playerName, onInvite, onClose }: InvitePlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const isL2 = clanModalIsL2();
  const titleCls = isL2
    ? "text-[14px] text-[#d4c4a8] mb-3 border-b border-[#5c4a32]/45 pb-2"
    : "text-[14px] text-[#f4e2b8] mb-3";
  const accentName = isL2 ? "text-[#e8c56e] font-semibold" : "text-white";

  const handleInvite = async () => {
    try {
      setLoading(true);
      await onInvite();
      onClose();
    } catch (err: any) {
      showToast(err?.message || "Ошибка при приглашении", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clanModalBackdropClass()}>
      <div className={clanModalPanelClass("max-w-[320px] mx-auto")}>
        <div className={titleCls}>
          Запросити <span className={accentName}>{playerName}</span> в клан?
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleInvite} disabled={loading} className={clanModalBtnPrimaryClass()}>
            {loading ? "..." : "Запросити"}
          </button>
          <button type="button" onClick={onClose} className={clanModalBtnSecondaryClass()}>
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
