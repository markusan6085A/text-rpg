import React, { useState, useEffect } from "react";
import { showToast } from "../state/toastStore";
import { useHeroStore } from "../state/heroStore";
import { getMyClan, createClan, listClans, getClanInvites, respondClanInvite, type Clan, type ClanInvite } from "../utils/api";
import CreateClanForm from "./clans/CreateClanForm";
import ClanList from "./clans/ClanList";
import ClanInvitesModal from "./clan/modals/ClanInvitesModal";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";

interface ClansProps {
  navigate: (path: string) => void;
}

export default function Clans({ navigate }: ClansProps) {
  const hero = useHeroStore((s) => s.hero);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [allClans, setAllClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invites, setInvites] = useState<ClanInvite[]>([]);
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [clanName, setClanName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Завантажуємо мій клан та список кланів (hero?.id — стабільна залежність, не hero-об'єкт)
  useEffect(() => {
    if (hero?.id) loadData();
  }, [hero?.id]);

  const loadData = async (): Promise<Clan | null> => {
    if (!hero) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const myClanResponse = await getMyClan();
      if (myClanResponse.ok && myClanResponse.clan) {
        setMyClan(myClanResponse.clan);
      } else {
        setMyClan(null);
      }

      const clansResponse = await listClans();
      if (clansResponse.ok) setAllClans(clansResponse.clans);

      if (!myClanResponse.clan) {
        const invRes = await getClanInvites();
        setInvites(invRes.ok && invRes.invites.length > 0 ? invRes.invites : []);
      } else {
        setInvites([]);
      }
      return myClanResponse.clan ?? null;
    } catch (err) {
      console.error("[Clans] Failed to load data:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClan = async () => {
    if (!clanName.trim()) {
      showToast("Введите название клана!", "error");
      return;
    }

    if (clanName.length < 3 || clanName.length > 16) {
      showToast("Название клана должно быть от 3 до 16 символов!", "error");
      return;
    }

    try {
      const response = await createClan(clanName.trim(), hero?.id);
      if (response.ok) {
        setClanName("");
        setShowCreateForm(false);
        // Перенаправляємо на детальну сторінку клану
        navigate(`/clan/${response.clan.id}`);
      }
    } catch (err: any) {
      console.error("[Clans] Failed to create clan:", err);
      const msg = err?.body?.message || err?.body?.error || err?.message;
      const errorMessage = msg || "Ошибка при создании клана";
      showToast(errorMessage, "error");
    }
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.max(1, Math.ceil(allClans.length / itemsPerPage));
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleClanClick = (clanId: string) => {
    navigate(`/clan-info/${clanId}`);
  };

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const innerPanel = isL2
    ? "w-full max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "";
  const sepT = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-white/40";
  const sepB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-white/40";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex justify-center text-[#d4c4a8]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div className={isL2 ? "text-center text-[#8a7a60]" : "text-center text-[#dec28e]"}>
            Загрузка персонажа...
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div
      className={
        isL2 ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]` : "w-full text-white px-4 py-2"
      }
    >
      <div className={isL2 ? innerPanel : "w-full max-w-[360px] mx-auto"}>
        <div className="space-y-2">
          {/* Риска вище заголовка */}
          <div className={sepT} />

          {/* Заголовок з кількістю кланів */}
          <div
            className={`text-center text-[16px] font-semibold ${
              isL2 ? "text-[#e8c56e]" : "text-[#f4e2b8]"
            }`}
          >
            Кланы ({allClans.length})
          </div>

          {/* Риска нижче заголовка */}
          <div className={sepB} />

          {/* clann.jpg - збільшена */}
          <div className="flex justify-center">
            <img
              src="/icons/clann.jpg"
              alt="Кланы"
              className="w-48 h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icons/clan.jpg";
              }}
            />
          </div>

          {/* Запрошення в клан */}
          {!myClan && invites.length > 0 && (
            <div
              className={
                isL2
                  ? "mb-2 p-2 bg-black/30 border border-[#c7ad80]/35 rounded"
                  : "mb-2 p-2 bg-[#2a2a2a] border border-amber-600/50 rounded"
              }
            >
              <div
                className={
                  isL2
                    ? "text-[12px] text-[#c9a44c] cursor-pointer hover:text-[#e8c56e]"
                    : "text-[12px] text-amber-400 cursor-pointer hover:text-amber-300"
                }
                onClick={() => setShowInvitesModal(true)}
              >
                У вас {invites.length} запрошен(ь) в клан
              </div>
            </div>
          )}

          {/* Кнопка створення клану (тільки якщо немає клану) */}
          {!myClan && (
            <CreateClanForm
              clanName={clanName}
              showForm={showCreateForm}
              onClanNameChange={setClanName}
              onToggleForm={() => setShowCreateForm(!showCreateForm)}
              onCreateClan={handleCreateClan}
            />
          )}

          {/* Показуємо інформацію про мій клан, якщо він є */}
          {myClan && (
            <div
              className={
                isL2
                  ? "p-3 bg-black/25 border border-[#5c4a32]/55 rounded-md space-y-1 mb-2"
                  : "p-3 bg-[#1a1a1a] border border-white/40 rounded-md space-y-1 mb-2"
              }
            >
              <div
                className={`text-[12px] font-semibold ${isL2 ? "text-[#e8c56e]" : "text-[#f4e2b8]"}`}
              >
                Мой клан:
              </div>
              <div
                className={`text-[12px] cursor-pointer flex items-center gap-1 ${
                  isL2
                    ? "text-[#c9a44c] hover:text-[#e8c56e]"
                    : "text-[#c7ad80] hover:text-[#f4e2b8]"
                }`}
                onClick={() => navigate(`/clan-info/${myClan.id}`)}
              >
                {myClan.emblem && (
                  <img
                    src={`/clans-emblems/${myClan.emblem}`}
                    alt=""
                    className="w-2 h-2 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span>{myClan.name} (Level {myClan.level})</span>
              </div>
            </div>
          )}

          {/* Список кланів */}
          <ClanList
            clans={allClans}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onClanClick={handleClanClick}
            onPageChange={handlePageChange}
          />

          {/* Риска вище тексту */}
          <div className={sepT} />

          {/* Текст внизу */}
          <div
            className={`text-[11px] space-y-1 pt-4 ${isL2 ? "text-[#8a7a60]" : "text-[#9f8d73]"}`}
          >
            <div>
              Клан - это группа людей, объединенных общими идеями развития своих персонажей, целями их развития и средствами для их осуществления.
            </div>
            <div className="text-center">
              Именно ты можешь изменить ход истории
            </div>
          </div>

          {/* Риска нижче тексту */}
          <div className={sepB} />

          {/* Кнопка назад */}
          <div className="mt-2 flex justify-center">
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              В город
            </span>
          </div>
        </div>
      </div>

      {showInvitesModal && (
        <ClanInvitesModal
          invites={invites}
          onRespond={async (inviteId, accept) => {
            await respondClanInvite(inviteId, accept);
            setShowInvitesModal(false);
            const myClan = await loadData();
            if (accept && myClan) navigate(`/clan/${myClan.id}`);
          }}
          onClose={() => setShowInvitesModal(false)}
        />
      )}
    </div>
  );
}
