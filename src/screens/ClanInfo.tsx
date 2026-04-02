import React, { useState, useEffect } from "react";
import { showToast } from "../state/toastStore";
import { getClan, applyToClan, type Clan, type ClanMember } from "../utils/api";
import { ClanNameWithEmblem } from "../components/ClanNameWithEmblem";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { useHeroStore } from "../state/heroStore";
import ClanMembersModal from "./clan/modals/ClanMembersModal";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

interface ClanInfoProps {
  navigate: (path: string) => void;
  clanId: string;
}

export default function ClanInfo({ navigate, clanId }: ClanInfoProps) {
  const hero = useHeroStore((s) => s.hero);
  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersPage, setMembersPage] = useState(1);
  const membersPerPage = 10;
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadClanInfo(0);
  }, [clanId]);

  const loadClanInfo = async (retryCount: number) => {
    try {
      setLoading(true);
      const clanResponse = await getClan(clanId);
      if (clanResponse.ok) {
        setClan(clanResponse.clan);
        // Використовуємо учасників з відповіді getClan (яка вже містить список членів)
        if (clanResponse.clan.members && Array.isArray(clanResponse.clan.members)) {
          const leaderId = clanResponse.clan.creator?.id;
          const membersList = clanResponse.clan.members.map((m: any) => ({
            id: m.id,
            characterId: m.characterId,
            characterName: m.characterName,
            characterLevel: 0,
            title: m.title || null,
            isDeputy: m.isDeputy || false,
            isLeader: m.characterId === leaderId,
            joinedAt: m.joinedAt,
            isOnline: m.isOnline || false,
          }));
          setMembers(membersList);
        } else {
          setMembers([]);
        }
      } else {
        showToast("Клан не найден", "error");
        navigate("/clans");
      }
    } catch (err: any) {
      console.error("[ClanInfo] Failed to load clan:", err);
      if (retryCount < 1 && err?.status !== 404) {
        await new Promise((r) => setTimeout(r, 1500));
        return loadClanInfo(retryCount + 1);
      }
      showToast("Ошибка при загрузке информации о клане", "error");
      navigate("/clans");
    } finally {
      setLoading(false);
    }
  };

  // Обчислюємо максимум учасників на основі рівня клану
  const getMaxMembers = (level: number): number => {
    if (level >= 8) return 80;
    if (level >= 7) return 70;
    if (level >= 6) return 60;
    if (level >= 5) return 50;
    if (level >= 4) return 40;
    if (level >= 3) return 30;
    if (level >= 2) return 20;
    return 10; // level 1
  };

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const innerPanel = isL2
    ? "w-full max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "";
  const sepT = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-white/40";
  const sepB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-white/40";

  if (loading) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex justify-center text-[#d4c4a8]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div className={isL2 ? "text-center text-[#8a7a60]" : "text-center text-[#dec28e]"}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex justify-center text-[#d4c4a8]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div className={isL2 ? "text-center text-[#8a7a60]" : "text-center text-[#dec28e]"}>Клан не найден</div>
        </div>
      </div>
    );
  }

  const maxMembers = getMaxMembers(clan.level);
  const totalPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const canApply = !clan.isMember && members.length < maxMembers;

  const handleApply = async () => {
    if (!clan || !hero || applying) return;
    try {
      setApplying(true);
      await applyToClan(clan.id);
      loadClanInfo(0);
    } catch (err: any) {
      showToast(err?.message || "Ошибка при подаче заявки", "error");
    } finally {
      setApplying(false);
    }
  };
  const startIndex = (membersPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const currentMembers = members.slice(startIndex, endIndex);

  return (
    <div
      className={
        isL2 ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]` : "w-full text-white px-4 py-2"
      }
    >
      <div className={isL2 ? innerPanel : "w-full max-w-[360px] mx-auto"}>
        <div className="space-y-3">
          {/* Риска вище назви клану */}
          <div className={sepT} />

          {/* Назва клану */}
          <div
            className={`text-center text-[16px] font-semibold ${
              isL2 ? "text-[#e8c56e]" : "text-[#f4e2b8]"
            }`}
          >
            <ClanNameWithEmblem clan={clan} size={12} />
          </div>

          {/* Риска нижче назви клану */}
          <div className={sepB} />

          {/* Емблема клану */}
          <div className="flex justify-center">
            <img
              src="/icons/clanns.png"
              alt="Клан"
              className="w-48 h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icons/clann.jpg";
              }}
            />
          </div>

          {/* Статистика клану */}
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between">
              <span className={isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]"}>Уровень:</span>
              <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>{clan.level}</span>
            </div>
            <div className="flex justify-between">
              <span className={isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]"}>Лидер:</span>
              <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>
                <PlayerNameWithEmblem
                  playerName={clan.creator.name}
                  hero={hero}
                  clan={clan}
                  size={10}
                  className="cursor-pointer hover:opacity-80 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (clan.creator.id) {
                      navigate(`/player/${clan.creator.id}`);
                    } else {
                      navigate(`/player/${clan.creator.name}`);
                    }
                  }}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]"}>Репутация:</span>
              <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>{clan.reputation}</span>
            </div>
            <div className="flex justify-between">
              <span className={isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]"}>Основан:</span>
              <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>
                {new Date(clan.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
          </div>

          <div className={sepT} />

          {/* Список учасників */}
          <div className="space-y-2">
            <div
              className={`text-[12px] font-semibold cursor-pointer transition-colors ${
                isL2
                  ? "text-[#c9a44c] hover:text-[#e8c56e]"
                  : "text-[#c7ad80] hover:text-[#f4e2b8]"
              }`}
              onClick={() => setShowMembersModal(true)}
            >
              Состав ({members.length}/{maxMembers})
            </div>
            <div
              className={
                isL2
                  ? "bg-black/25 border border-[#5c4a32]/55 rounded p-2 max-h-64 overflow-y-auto space-y-1"
                  : "bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1"
              }
            >
              {currentMembers.length === 0 ? (
                <div className={isL2 ? "text-[11px] text-[#8a7a60]" : "text-[11px] text-[#9f8d73]"}>
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
                          ? "text-[11px] border-b border-solid border-[#5c4a32]/35 pb-1"
                          : "text-[11px] border-b border-solid border-white/40 pb-1"
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <PlayerNameWithEmblem
                            playerName={member.characterName}
                            hero={hero}
                            clan={clan}
                            size={10}
                            className={`cursor-pointer hover:opacity-80 transition-colors ${
                              isOnline
                                ? "text-green-500"
                                : isL2
                                  ? "text-[#e8dcc8]"
                                  : "text-white"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (member.characterId) {
                                navigate(`/player/${member.characterId}`);
                              } else {
                                navigate(`/player/${member.characterName}`);
                              }
                            }}
                          />
                          <span className="ml-1">[{isOnline ? "On" : "Off"}]</span>
                          <div className={isL2 ? "text-[#8a7a60] mt-0.5" : "text-[#9f8d73] mt-0.5"}>
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

            {/* Пагінація учасників */}
            {totalPages > 1 && (
              <div
                className={`flex justify-center items-center gap-2 text-[11px] ${
                  isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]"
                }`}
              >
                <button
                  onClick={() => {
                    if (membersPage > 1) {
                      setMembersPage(membersPage - 1);
                    }
                  }}
                  disabled={membersPage === 1}
                  className={`px-2 py-1 ${
                    membersPage === 1
                      ? "text-gray-500 cursor-not-allowed"
                      : isL2
                        ? "text-[#c9a44c] hover:text-[#e8c56e]"
                        : "text-[#c7ad80] hover:text-[#f4e2b8]"
                  }`}
                >
                  &lt;
                </button>
                <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>
                  {membersPage} / {totalPages}
                </span>
                <button
                  onClick={() => {
                    if (membersPage < totalPages) {
                      setMembersPage(membersPage + 1);
                    }
                  }}
                  disabled={membersPage === totalPages}
                  className={`px-2 py-1 ${
                    membersPage === totalPages
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
          </div>

          <div className={sepT} />

          {/* Оголошення */}
          {clan.announcement && clan.announcement.trim() && (
            <div
              className={
                isL2
                  ? "p-2 bg-black/25 border border-[#5c4a32]/50 rounded text-[12px] text-[#c9a44c] whitespace-pre-wrap"
                  : "p-2 bg-[#1a1a1a] border border-white/30 rounded text-[12px] text-[#c7ad80] whitespace-pre-wrap"
              }
            >
              {clan.announcement}
            </div>
          )}

          {/* Подати заявку */}
          {canApply && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full py-2 bg-[#5a4424] text-white text-[12px] rounded hover:bg-[#6a5434] disabled:opacity-50"
            >
              {applying ? "..." : "Подать заявку"}
            </button>
          )}

          {/* Кнопка назад */}
          <div className="mt-4 flex justify-center">
            <span
              onClick={() => navigate("/clans")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              В город
            </span>
          </div>
        </div>
      </div>

      {/* Модалка перегляду всіх гравців клану */}
      {showMembersModal && clan && (
        <ClanMembersModal
          members={members}
          clan={clan}
          onClose={() => setShowMembersModal(false)}
          onPlayerClick={(characterId, characterName) => {
            setShowMembersModal(false);
            if (characterId) {
              navigate(`/player/${characterId}`);
            } else {
              navigate(`/player/${characterName}`);
            }
          }}
        />
      )}
    </div>
  );
}
