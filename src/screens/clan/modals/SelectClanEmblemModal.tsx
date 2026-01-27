import React, { useState } from "react";
import { CLAN_EMBLEMS, getEmblemPath } from "../../../data/clanEmblems";

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

  // Діагностика: виводимо шляхи в консоль
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SelectClanEmblemModal] Current emblems:', currentEmblems);
      currentEmblems.forEach((emblem) => {
        const path = getEmblemPath(emblem);
        console.log(`[SelectClanEmblemModal] Emblem: ${emblem}, Path: ${path}`);
      });
    }
  }, [currentEmblems]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#5a4424] rounded p-4 max-w-[360px] w-full mx-4">
        <div className="text-[14px] text-[#f4e2b8] mb-3 text-center">Выберите эмблему клана:</div>
        
        {/* Сітка емблем */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {currentEmblems.map((emblem) => {
            const emblemPath = getEmblemPath(emblem);
            const isSelected = currentEmblem === emblem;
            
            return (
              <div
                key={emblem}
                className={`relative cursor-pointer border-2 rounded p-1 transition-all flex items-center justify-center ${
                  isSelected
                    ? "border-yellow-500 bg-yellow-500/20"
                    : "border-[#3b2614] hover:border-[#5a4424]"
                }`}
                style={{ 
                  minHeight: "56px", 
                  minWidth: "56px",
                  backgroundColor: "#141215" // Фон сторінки гри
                }}
                onClick={() => onSelect(emblem)}
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
                      minHeight: "40px"
                    }}
                    onError={(e) => {
                      console.error(`[SelectClanEmblemModal] Failed to load emblem: ${emblemPath}`);
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector(".emblem-placeholder")) {
                        const placeholder = document.createElement("div");
                        placeholder.className = "emblem-placeholder text-[8px] text-gray-500 text-center flex items-center justify-center w-full h-full";
                        placeholder.textContent = "?";
                        parent.appendChild(placeholder);
                      }
                    }}
                    onLoad={() => {
                      // Діагностика: виводимо в консоль, коли зображення завантажилося
                      if (process.env.NODE_ENV === 'development') {
                        console.log(`[SelectClanEmblemModal] Successfully loaded emblem: ${emblemPath}`);
                      }
                    }}
                  />
                ) : (
                  <div className="text-[8px] text-gray-500 text-center flex items-center justify-center w-full h-full">
                    ?
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] px-1 rounded z-10">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 text-[11px] text-[#c7ad80] mb-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-2 py-1 ${page === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
            >
              &lt;
            </button>
            <span className="text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-2 py-1 ${page === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
            >
              &gt;
            </button>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-[12px] text-red-600 hover:text-red-500 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
