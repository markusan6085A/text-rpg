import React, { useState } from "react";
import { useHeroStore } from "../../state/heroStore";
import { getProfessionDefinition, normalizeProfessionId } from "../../data/skills";
import { getExpToNext, EXP_TABLE, MAX_LEVEL } from "../../data/expTable";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";
import RecipeBookButton from "./RecipeBookButton";
import CharacterQuests from "./CharacterQuests";

// Форматирование чисел (как в City)
const formatNumber = (num: number) => {
  return num.toLocaleString("ru-RU");
};

export default function Character() {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  
  // Навігація для кнопки "Умения"
  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showQuests, setShowQuests] = useState(false);

  // Hero вже завантажений в App.tsx, не потрібно завантажувати тут

  // -----------------------------
  // Локальні значення з hero
  // -----------------------------
  const nickname = hero?.name || "";
  const level = hero?.level || 1;
  const race = hero?.race || "";
  const gender = hero?.gender || "";
  const status = hero?.status || "";
  const profession = hero?.profession || "";
  const adena = hero?.adena || 0;
  const coins = hero?.coinOfLuck || 0;

  // -----------------------------
  // EXP calculation
  // -----------------------------
  const totalExp = hero?.exp ?? 0;
  // EXP needed to reach current level (EXP_TABLE[level-1] is the exp needed to reach level)
  // For level 1: EXP_TABLE[0] = 0
  // For level 2: EXP_TABLE[1] = 68
  // For level 80: EXP_TABLE[79] = 3 726 116 782
  const currentLevelExp = level > 1 ? (EXP_TABLE[level - 1] ?? 0) : 0;
  // Current EXP on this level
  const expCurrent = Math.max(0, totalExp - currentLevelExp);
  // EXP needed for next level
  const expToNext = getExpToNext(level);
  // If max level, show the total exp needed to reach max level (5 000 000 000 for level 80)
  const expToNextDisplay = level >= MAX_LEVEL 
    ? (EXP_TABLE[MAX_LEVEL - 1] ?? 0) 
    : expToNext;
  const expPercent = expToNextDisplay > 0 
    ? Math.min(100, Math.floor((expCurrent / expToNextDisplay) * 100)) 
    : 100;

  // -----------------------------
  // SP
  // -----------------------------
  const sp = hero?.sp ?? 0;

  // -----------------------------
  // Сохранение статуса
  // -----------------------------
  const saveStatus = () => {
    updateHero({ status: newStatus });
    setShowStatusModal(false);
  };


  const btn =
    "w-20 py-1 text-[10px] bg-[#0f0a06] text-white border border-[#3e301c] rounded-md";

  if (!hero)
    return <div className="text-white text-center mt-10">Загрузка...</div>;

  return (
    <div className="w-full flex flex-col items-center text-white">
      <div className="w-full max-w-[360px] mt-2 px-3 bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4">
      <div
        className="flex flex-col items-center relative"
        style={{
          width: "100%",
          paddingTop: "10px",
          paddingBottom: "10px",
        }}
      >

        {/* ========================================================= */}
        {/*     ВЕРХ — ИНФО + КНОПКИ СПРАВА      */}
        {/* ========================================================= */}
        <div className="w-full px-3 mb-2 mt-1 flex justify-between">

          {/* ЛІВА ІНФОРМАЦІЯ */}
          <div className="flex flex-col text-left mt-1 flex-1">
            <div className="border-t border-gray-500 pt-2 pb-2">
              <div className="text-xs">
                Статус:{" "}
                {status ? (
                  <span className="text-yellow-400">{status}</span>
                ) : (
                  <span className="text-gray-400">нет</span>
                )}
                <button
                  className="text-red-400 underline ml-1 text-[10px]"
                  onClick={() => {
                    setNewStatus(status);
                    setShowStatusModal(true);
                  }}
                >
                  ред
                </button>
              </div>

              <div className="text-[11px] text-yellow-300 mt-1">
                Профессия:{" "}
                {(() => {
                  const profId = normalizeProfessionId(profession as any);
                  const profDef = profId ? getProfessionDefinition(profId) : null;
                  return profDef?.label || profession || "Нет";
                })()}
              </div>
            </div>
            <div className="border-b border-gray-500"></div>
          </div>

          {/* КНОПКИ СПРАВА */}
          <div className="flex flex-col gap-1 text-right text-[10px] ml-2">
            <button
              className="w-16 py-[2px] bg-[#1d140c] text-white border border-[#5b4726] rounded-md"
              onClick={() => (window.location.href = "/")}
            >
              Выход
            </button>

            <button
              className="w-16 py-[2px] bg-[#1d140c] text-white border border-[#5b4726] rounded-md"
              onClick={() => alert("Меню в разработке")}
            >
              Меню
            </button>
          </div>

        </div>

        {/* ========================================= */}
        {/*     МОДЕЛЬ + СЛОТЫ — СПІЛЬНИЙ КОМПОНЕНТ  */}
        {/* ========================================= */}
        <CharacterEquipmentFrame allowUnequip={false} marginTop="20px" />

        {/* ========================================================= */}
        {/*     СТОЛБЕЦ ПУНКТОВ — КАК ТЫ ПРОСИЛ                        */}
        {/* ========================================================= */}
        <div className="w-[330px] text-left text-[12px] text-[#d3d3d3] mt-4 space-y-1">

          <div className="border-b border-gray-600 pb-1 flex items-center gap-2">
            <img src="/icons/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
            <span>Аденa: <span className="text-yellow-300">{adena}</span></span>
          </div>
          <div className="border-b border-gray-600 pb-1 flex items-center gap-2">
            <img src="/icons/col (1).png" alt="Coin of Luck" className="w-3 h-3 object-contain" />
            <span>Coin of Luck: <span className="text-yellow-300">{coins}</span></span>
          </div>

          <div className="border-b border-gray-600 pb-1 flex items-center gap-2">
            <img src="/icons/star.png" alt="Experience" className="w-3 h-3 object-contain" />
            <span>
              Опыт: <span className="text-green-300">{formatNumber(expCurrent)}</span> / <span className="text-green-300">{formatNumber(expToNextDisplay)}</span>
            </span>
          </div>

          <div className="border-b border-gray-600 pb-1 flex items-center gap-2">
            <img src="/icons/news.png" alt="SP" className="w-3 h-3 object-contain" />
            <span>
              SP: <span className="text-blue-300">{formatNumber(sp)}</span>
            </span>
          </div>

          <button
            onClick={() => navigate("/learned-skills")}
            className="mt-2 text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-gray-600 pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/news.png" alt="Skills" className="w-3 h-3 object-contain" />
            <span>Умения</span>
          </button>
          <RecipeBookButton navigate={navigate} />
          <button
            onClick={() => setShowQuests(!showQuests)}
            className="text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-gray-600 pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/news.png" alt="Quests" className="w-3 h-3 object-contain" />
            <span>Мои квесты</span>
          </button>

          <div className="mt-2 border-b border-gray-600 pb-1 flex items-center gap-2">
            <img src="/icons/rate.png" alt="Ratings" className="w-3 h-3 object-contain" />
            <span>Рейтинги</span>
          </div>
          <button
            onClick={() => navigate("/daily-quests")}
            className="text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-gray-600 pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/battles.png" alt="Daily Quests" className="w-3 h-3 object-contain" />
            <span>Ежедневные задания</span>
          </button>

          <button
            onClick={() => navigate("/premium-account")}
            className="mt-2 text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-gray-600 pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/coin.png" alt="Premium" className="w-3 h-3 object-contain" />
            <span>Премиум аккаунт (ускоренная прокачка)</span>
          </button>
        </div>

        {/* Квести */}
        {showQuests && (
          <div className="w-full mt-4">
            <CharacterQuests />
          </div>
        )}

      </div>

      {/* Модалка статуса */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1a1208] border border-[#5b4726] rounded-lg p-4" style={{ width: "260px" }}>
            <div className="text-yellow-400 font-bold text-sm text-center mb-2">
              Новый статус
            </div>

            <input
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-black text-white border border-[#5b4726] p-1 text-sm mb-3 rounded"
              placeholder="Введите статус..."
            />

            <div className="flex gap-2 justify-center">
              <button
                onClick={saveStatus}
                className="bg-green-700 text-white text-[11px] py-1 px-4 rounded"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="bg-gray-600 text-white text-[11px] py-1 px-4 rounded"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
