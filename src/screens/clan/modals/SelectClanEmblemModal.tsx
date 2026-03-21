import React, { useState } from "react";
import { CLAN_EMBLEMS, getEmblemPath } from "../../../data/clanEmblems";
import {
  clanModalBackdropClass,
  clanModalCancelLinkClass,
  clanModalEmblemCellBackground,
  clanModalEmblemCellClass,
  clanModalIsL2,
  clanModalMutedClass,
  clanModalPaginationBtnClass,
  clanModalPaginationPageClass,
  clanModalPanelClass,
  clanModalTitleClass,
} from "./clanModalL2";

interface SelectClanEmblemModalProps {
  currentEmblem: string | null;
  onSelect: (emblem: string) => void;
  onClose: () => void;
}

export default function SelectClanEmblemModal({
  currentEmblem,
  onSelect,
  onClose,
}: SelectClanEmblemModalProps) {
  const [page, setPage] = useState(1);
  const emblemsPerPage = 10;
  const totalPages = Math.ceil(CLAN_EMBLEMS.length / emblemsPerPage);
  const startIndex = (page - 1) * emblemsPerPage;
  const endIndex = startIndex + emblemsPerPage;
  const currentEmblems = CLAN_EMBLEMS.slice(startIndex, endIndex);
  const isL2 = clanModalIsL2();
  const cellBg = clanModalEmblemCellBackground();

  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[SelectClanEmblemModal] Current emblems:", currentEmblems);
      currentEmblems.forEach((emblem) => {
        const path = getEmblemPath(emblem);
        console.log(`[SelectClanEmblemModal] Emblem: ${emblem}, Path: ${path}`);
      });
    }
  }, [currentEmblems]);

  const checkBadgeCls = isL2
    ? "absolute top-0 right-0 bg-[#c9a44c] text-[#1a1410] text-[8px] font-bold px-1 rounded z-10"
    : "absolute top-0 right-0 bg-yellow-500 text-black text-[8px] px-1 rounded z-10";

  return (
    <div className={clanModalBackdropClass()} onClick={onClose}>
      <div className={clanModalPanelClass("max-w-[360px] mx-auto")} onClick={(e) => e.stopPropagation()}>
        <div className={`${clanModalTitleClass()} text-center`}>Выберите эмблему клана:</div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {currentEmblems.map((emblem) => {
            const emblemPath = getEmblemPath(emblem);
            const isSelected = currentEmblem === emblem;

            return (
              <div
                key={emblem}
                className={clanModalEmblemCellClass(isSelected)}
                style={{
                  minHeight: "56px",
                  minWidth: "56px",
                  backgroundColor: cellBg,
                }}
                onClick={() => onSelect(emblem)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(emblem)}
                role="button"
                tabIndex={0}
              >
                {emblemPath ? (
                  <img
                    src={emblemPath}
                    alt={emblem}
                    className="w-full h-full object-contain"
                    style={{
                      maxWidth: "56px",
                      maxHeight: "56px",
                      minWidth: "40px",
                      minHeight: "40px",
                    }}
                    onError={(e) => {
                      console.error(`[SelectClanEmblemModal] Failed to load emblem: ${emblemPath}`);
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector(".emblem-placeholder")) {
                        const placeholder = document.createElement("div");
                        placeholder.className = `emblem-placeholder text-[8px] text-center flex items-center justify-center w-full h-full ${clanModalMutedClass()}`;
                        placeholder.textContent = "?";
                        parent.appendChild(placeholder);
                      }
                    }}
                    onLoad={() => {
                      if (import.meta.env.DEV) {
                        console.log(`[SelectClanEmblemModal] Successfully loaded emblem: ${emblemPath}`);
                      }
                    }}
                  />
                ) : (
                  <div className={`text-[8px] text-center flex items-center justify-center w-full h-full ${clanModalMutedClass()}`}>
                    ?
                  </div>
                )}
                {isSelected && <div className={checkBadgeCls}>✓</div>}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className={`flex justify-center items-center gap-2 text-[11px] mb-4 ${clanModalMutedClass()}`}>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={clanModalPaginationBtnClass(page === 1)}
            >
              &lt;
            </button>
            <span className={clanModalPaginationPageClass()}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={clanModalPaginationBtnClass(page === totalPages)}
            >
              &gt;
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`flex-1 ${clanModalCancelLinkClass()}`}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
