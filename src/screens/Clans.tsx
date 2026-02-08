import React, { useState, useEffect } from "react";
import { useHeroStore } from "../state/heroStore";
import { getMyClan, createClan, listClans, type Clan } from "../utils/api";
import CreateClanForm from "./clans/CreateClanForm";
import ClanList from "./clans/ClanList";

interface ClansProps {
  navigate: (path: string) => void;
}

export default function Clans({ navigate }: ClansProps) {
  const hero = useHeroStore((s) => s.hero);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [allClans, setAllClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clanName, setClanName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Завантажуємо мій клан та список кланів
  useEffect(() => {
    loadData();
  }, [hero]);

  const loadData = async () => {
    if (!hero) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Завантажуємо мій клан
      const myClanResponse = await getMyClan();
      if (myClanResponse.ok && myClanResponse.clan) {
        setMyClan(myClanResponse.clan);
      } else {
        setMyClan(null);
      }

      // Завантажуємо список всіх кланів
      const clansResponse = await listClans();
      if (clansResponse.ok) {
        setAllClans(clansResponse.clans);
      }
    } catch (err) {
      console.error("[Clans] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClan = async () => {
    if (!clanName.trim()) {
      alert("Введите название клана!");
      return;
    }

    if (clanName.length < 3 || clanName.length > 16) {
      alert("Название клана должно быть от 3 до 16 символов!");
      return;
    }

    try {
      const response = await createClan(clanName.trim());
      if (response.ok) {
        setClanName("");
        setShowCreateForm(false);
        // Перенаправляємо на детальну сторінку клану
        navigate(`/clan/${response.clan.id}`);
      }
    } catch (err: any) {
      console.error("[Clans] Failed to create clan:", err);
      const errorMessage = err?.response?.data?.error || err?.message || "Ошибка при создании клана";
      alert(errorMessage);
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

  if (!hero) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка персонажа...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-2">
          {/* Риска вище заголовка */}
          <div className="border-t border-white/40"></div>

          {/* Заголовок з кількістю кланів */}
          <div className="text-center text-[16px] font-semibold text-[#f4e2b8]">
            Кланы ({allClans.length})
          </div>

          {/* Риска нижче заголовка */}
          <div className="border-b border-white/40"></div>

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
            <div className="p-3 bg-[#1a1a1a] border border-white/40 rounded-md space-y-1 mb-2">
              <div className="text-[12px] text-[#f4e2b8] font-semibold">Мой клан:</div>
              <div
                className="text-[12px] text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8] flex items-center gap-1"
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
          <div className="border-t border-white/40"></div>

          {/* Текст внизу */}
          <div className="text-[11px] text-[#9f8d73] space-y-1 pt-4">
            <div>
              Клан - это группа людей, объединенных общими идеями развития своих персонажей, целями их развития и средствами для их осуществления.
            </div>
            <div className="text-center">
              Именно ты можешь изменить ход истории
            </div>
          </div>

          {/* Риска нижче тексту */}
          <div className="border-b border-white/40"></div>

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
    </div>
  );
}
