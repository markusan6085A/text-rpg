import React, { useState, useEffect } from "react";
import { getClan, type Clan, type ClanMember } from "../utils/api";
import { ClanNameWithEmblem } from "../components/ClanNameWithEmblem";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { useHeroStore } from "../state/heroStore";
import ClanMembersModal from "./clan/modals/ClanMembersModal";

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

  useEffect(() => {
    loadClanInfo();
  }, [clanId]);

  const loadClanInfo = async () => {
    try {
      setLoading(true);
      const clanResponse = await getClan(clanId);
      if (clanResponse.ok) {
        setClan(clanResponse.clan);
        // Використовуємо учасників з відповіді getClan (яка вже містить список членів)
        // Конвертуємо формат з getClan до формату ClanMember
        if (clanResponse.clan.members && Array.isArray(clanResponse.clan.members)) {
          const leaderId = clanResponse.clan.creator?.id;
          const membersList = clanResponse.clan.members.map((m: any) => ({
            id: m.id,
            characterId: m.characterId,
            characterName: m.characterName,
            characterLevel: 0, // getClan не повертає level
            title: m.title || null,
            isDeputy: m.isDeputy || false,
            isLeader: m.characterId === leaderId,
            joinedAt: m.joinedAt,
            isOnline: m.isOnline || false,
          }));
          setMembers(membersList);
        } else {
          // Якщо members немає, встановлюємо порожній список
          setMembers([]);
        }
      } else {
        alert("Клан не найден");
        navigate("/clans");
      }
    } catch (err) {
      console.error("[ClanInfo] Failed to load clan:", err);
      alert("Ошибка при загрузке информации о клане");
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

  if (loading) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Клан не найден</div>
        </div>
      </div>
    );
  }

  const maxMembers = getMaxMembers(clan.level);
  const totalPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const startIndex = (membersPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const currentMembers = members.slice(startIndex, endIndex);

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          {/* Риска вище назви клану */}
          <div className="border-t border-gray-600"></div>

          {/* Назва клану */}
          <div className="text-center text-[16px] font-semibold text-[#f4e2b8]">
            <ClanNameWithEmblem clan={clan} size={12} />
          </div>

          {/* Риска нижче назви клану */}
          <div className="border-b border-gray-600"></div>

          {/* Емблема клану */}
          <div className="flex justify-center">
            {clan.emblem ? (
              <img
                src={`/clans-emblems/${clan.emblem}`}
                alt="Емблема клану"
                className="w-48 h-48 object-contain"
                style={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.1)", // Світлий фон для видимості прозорих PNG
                  padding: "10px",
                  borderRadius: "8px"
                }}
                onError={(e) => {
                  console.error(`[ClanInfo] Failed to load emblem: ${clan.emblem}`);
                  // Fallback до дефолтного зображення
                  (e.target as HTMLImageElement).src = "/icons/clanns.png";
                }}
              />
            ) : (
              <img
                src="/icons/clanns.png"
                alt="Клан"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icons/clann.jpg";
                }}
              />
            )}
          </div>

          {/* Статистика клану */}
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Уровень:</span>
              <span className="text-white">{clan.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Лидер:</span>
              <span className="text-white">
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
              <span className="text-[#c7ad80]">Репутация:</span>
              <span className="text-white">{clan.reputation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Основан:</span>
              <span className="text-white">
                {new Date(clan.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-600"></div>

          {/* Список учасників */}
          <div className="space-y-2">
            <div
              className="text-[12px] text-[#c7ad80] font-semibold cursor-pointer hover:text-[#f4e2b8] transition-colors"
              onClick={() => setShowMembersModal(true)}
            >
              Состав ({members.length}/{maxMembers})
            </div>
            <div className="bg-[#1a1a1a] border border-[#3b2614] rounded p-2 max-h-64 overflow-y-auto space-y-1">
              {currentMembers.length === 0 ? (
                <div className="text-[11px] text-[#9f8d73]">Нет участников</div>
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
                      className="text-[11px] border-b border-dotted border-[#3b2614] pb-1"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <PlayerNameWithEmblem
                            playerName={member.characterName}
                            hero={hero}
                            clan={clan}
                            size={10}
                            className={`cursor-pointer hover:opacity-80 transition-colors ${isOnline ? "text-green-500" : "text-white"}`}
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

            {/* Пагінація учасників */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]">
                <button
                  onClick={() => {
                    if (membersPage > 1) {
                      setMembersPage(membersPage - 1);
                    }
                  }}
                  disabled={membersPage === 1}
                  className={`px-2 py-1 ${membersPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                >
                  &lt;
                </button>
                <span className="text-white">
                  {membersPage} / {totalPages}
                </span>
                <button
                  onClick={() => {
                    if (membersPage < totalPages) {
                      setMembersPage(membersPage + 1);
                    }
                  }}
                  disabled={membersPage === totalPages}
                  className={`px-2 py-1 ${membersPage === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-600"></div>

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
