import React from "react";
import { ClanNameWithEmblem } from "../../components/ClanNameWithEmblem";
import type { Clan } from "../../utils/api";

interface ClanListItem {
  id: string;
  name: string;
  level: number;
  emblem?: string | null;
}

interface ClanListProps {
  clans: Clan[];
  currentPage: number;
  itemsPerPage: number;
  onClanClick: (clanId: string) => void;
  onPageChange: (page: number) => void;
}

export default function ClanList({
  clans,
  currentPage,
  itemsPerPage,
  onClanClick,
  onPageChange,
}: ClanListProps) {
  const totalPages = Math.max(1, Math.ceil(clans.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClans = clans.slice(startIndex, endIndex);

  if (clans.length === 0) {
    return (
      <div className="text-center text-[#9f8d73] text-sm py-4">
        Кланов пока нет
      </div>
    );
  }

  return (
    <>
      {/* Заголовки таблиці */}
      <div className="grid grid-cols-2 gap-2 text-[12px] text-[#c7ad80] border-b border-[#3b2614] pb-1">
        <div>Название</div>
        <div className="text-right">Уровень</div>
      </div>

      {/* Список кланів */}
      <div className="space-y-1">
        {currentClans.map((clan) => (
          <div
            key={clan.id}
            className="grid grid-cols-2 gap-2 text-[12px] text-[#d3d3d3] py-1 border-b border-dotted border-[#3b2614] cursor-pointer hover:text-[#f4e2b8]"
            onClick={() => onClanClick(clan.id)}
          >
            <div className="flex items-center gap-1">
              {clan.emblem && (
                <img
                  src={`/clans-emblems/${clan.emblem}`}
                  alt=""
                  className="w-1.5 h-1.5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span>{clan.name}</span>
            </div>
            <div className="text-right">Level {clan.level}</div>
          </div>
        ))}
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 text-[12px] text-[#c7ad80]">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 ${currentPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &lt;&lt;
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 ${currentPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 py-1 ${
                currentPage === page
                  ? "text-[#f4e2b8] font-bold"
                  : "text-[#c7ad80] hover:text-[#f4e2b8]"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 ${currentPage === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &gt;
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 ${currentPage === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &gt;&gt;
          </button>
        </div>
      )}
    </>
  );
}
