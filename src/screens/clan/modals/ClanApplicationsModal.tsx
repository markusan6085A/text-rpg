import React from "react";
import { type ClanApplication } from "../../../utils/api";
import {
  clanModalApplicationCardClass,
  clanModalBackdropClass,
  clanModalBtnAcceptClass,
  clanModalBtnSecondaryClass,
  clanModalMutedClass,
  clanModalPanelClass,
  clanModalTitleClass,
  clanModalIsL2,
} from "./clanModalL2";

interface ClanApplicationsModalProps {
  applications: ClanApplication[];
  onAccept: (characterId: string) => Promise<void>;
  onDecline: (characterId: string) => Promise<void>;
  onClose: () => void;
}

export default function ClanApplicationsModal({
  applications,
  onAccept,
  onDecline,
  onClose,
}: ClanApplicationsModalProps) {
  const isL2 = clanModalIsL2();
  const nameCls = isL2 ? "text-[12px] text-[#e8dcc8] font-medium" : "text-[12px] text-white font-medium";
  const lvlCls = `text-[11px] ml-1 ${clanModalMutedClass()}`;

  return (
    <div className={clanModalBackdropClass()}>
      <div className={clanModalPanelClass("max-w-[360px] mx-auto max-h-[80vh] overflow-y-auto")}>
        <div className={clanModalTitleClass()}>Заявки в клан</div>
        {applications.length === 0 ? (
          <div className={`text-[12px] ${clanModalMutedClass()}`}>Немає заявок</div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className={clanModalApplicationCardClass()}>
                <div className="min-w-0">
                  <span className={nameCls}>{app.characterName ?? "?"}</span>
                  {app.characterLevel != null && <span className={lvlCls}>(рівень {app.characterLevel})</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => onAccept(app.characterId!)} className={clanModalBtnAcceptClass()}>
                    Прийняти
                  </button>
                  <button type="button" onClick={() => onDecline(app.characterId!)} className={clanModalBtnSecondaryClass()}>
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={onClose} className={`mt-3 ${clanModalBtnSecondaryClass()} w-full`}>
          Закрити
        </button>
      </div>
    </div>
  );
}
