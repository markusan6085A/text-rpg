import React, { useState } from "react";
import type { ClanMember } from "../../../utils/api";
import { PlayerNameWithEmblem } from "../../../components/PlayerNameWithEmblem";
import { useHeroStore } from "../../../state/heroStore";
import type { Clan } from "../../../utils/api";
import { getCityUiVariant } from "../../../utils/cityUiVariant";

interface ClanMembersModalProps {
  members: ClanMember[];
  clan: Clan;
  onClose: () => void;
  onPlayerClick: (characterId: string, characterName: string) => void;
}

export default function ClanMembersModal({
  members,
  clan,
  onClose,
  onPlayerClick,
}: ClanMembersModalProps) {
  const isL2 = getCityUiVariant() === "l2";
  const hero = useHeroStore((s) => s.hero);
  const [page, setPage] = useState(1);
  const membersPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const startIndex = (page - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const currentMembers = members.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={
          isL2
            ? "bg-[#14110c] border border-[#c7ad80]/35 rounded-lg p-4 max-w-[360px] w-full mx-4 max-h-[80vh] overflow-y-auto shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
            : "bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[360px] w-full mx-4 max-h-[80vh] overflow-y-auto"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            isL2
              ? "text-[14px] text-[#e8c56e] mb-3 text-center font-semibold"
              : "text-[14px] text-[#f4e2b8] mb-3 text-center font-semibold"
          }
        >
          Состав клана ({members.length})
        </div>

        {/* Список гравців */}
        <div className="space-y-1 mb-4">
          {currentMembers.length === 0 ? (
            <div className={isL2 ? "text-[11px] text-[#8a7a60] text-center" : "text-[11px] text-[#9f8d73] text-center"}>
              Нет участников
            </div>
          ) : (
            currentMembers.map((member) => {
              const isOnline = member.isOnline;
              const titleDisplay = member.title || "Нет титула";
              const roles = [];
              if (member.isLeader) roles.push("Глава клана");
              if (member.isDeputy) roles.push("Заместитель главы");
              const rolesDisplay = roles.length > 0 ? `, ${roles.join(", ")}` : "";

              return (
                <div
                  key={member.id}
                  className={
                    isL2
                      ? "text-[11px] border-b border-solid border-[#5c4a32]/35 pb-1 cursor-pointer hover:bg-black/25 transition-colors p-1 rounded"
                      : "text-[11px] border-b border-solid border-white/40 pb-1 cursor-pointer hover:bg-[#2a2a2a] transition-colors p-1 rounded"
                  }
                  onClick={() => {
                    if (member.characterId) {
                      onPlayerClick(member.characterId, member.characterName);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <PlayerNameWithEmblem
                        playerName={member.characterName}
                        hero={hero}
                        clan={clan}
                        size={10}
                        className={`font-semibold ${
                          isOnline ? "text-green-500" : isL2 ? "text-[#e8dcc8]" : "text-white"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (member.characterId) {
                            onPlayerClick(member.characterId, member.characterName);
                          }
                        }}
                      />
                      <span className="ml-1">[{isOnline ? "On" : "Off"}]</span>
                      <div className="text-[#9f8d73] mt-0.5">
                        {titleDisplay}
                        {rolesDisplay}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div
            className={`flex justify-center items-center gap-2 text-[11px] mb-4 ${
              isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]"
            }`}
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-2 py-1 ${
                page === 1
                  ? "text-gray-500 cursor-not-allowed"
                  : isL2
                    ? "text-[#c9a44c] hover:text-[#e8c56e]"
                    : "text-[#c7ad80] hover:text-[#f4e2b8]"
              }`}
            >
              &lt;
            </button>
            <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-2 py-1 ${
                page === totalPages
                  ? "text-gray-500 cursor-not-allowed"
                  : isL2
                    ? "text-[#c9a44c] hover:text-[#e8c56e]"
                    : "text-[#c7ad80] hover:text-[#f4e2b8]"
              }`}
            >
              &gt;
            </button>
          </div>
        )}

        {/* Кнопка закриття */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-[12px] text-red-600 hover:text-red-500 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
