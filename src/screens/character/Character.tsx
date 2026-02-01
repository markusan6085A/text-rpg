import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { getProfessionDefinition, normalizeProfessionId } from "../../data/skills";
import { getExpToNext, EXP_TABLE, MAX_LEVEL } from "../../data/expTable";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";
import RecipeBookButton from "./RecipeBookButton";
import CharacterQuests from "./CharacterQuests";
import CharacterBuffs from "./CharacterBuffs";
import SevenSealsBonusModal from "../../components/SevenSealsBonusModal";
import { listCharacters, getSevenSealsRank, claimSevenSealsReward, type Character } from "../../utils/api";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";

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
  const [characterData, setCharacterData] = useState<Character | null>(null);
  const [sevenSealsRank, setSevenSealsRank] = useState<number | null>(null);
  const [showSevenSealsModal, setShowSevenSealsModal] = useState(false);

  const characterId = useCharacterStore((s) => s.characterId);

  // Завантажуємо Seven Seals ранг для badge "Победитель 7 печатей" + auto-claim нагороди
  useEffect(() => {
    const load = async () => {
      if (!characterId || !hero) return;
      try {
        const data = await getSevenSealsRank(characterId);
        if (data.rank && data.rank >= 1 && data.rank <= 3) {
          setSevenSealsRank(data.rank);
          // Якщо ще не отримано нагороду — запитуємо claim (сервер згенерує рандомні стати)
          const heroJson = (hero as any)?.heroJson || {};
          if (!heroJson.sevenSealsBonus) {
            try {
              const claimRes = await claimSevenSealsReward(characterId);
              if (claimRes.ok && !claimRes.alreadyClaimed) {
                const loadedHero = await loadHeroFromAPI();
                if (loadedHero) useHeroStore.getState().setHero(loadedHero);
              }
            } catch {
              // ignore claim errors
            }
          }
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [characterId, hero?.name]);

  // Завантажуємо Character для отримання createdAt
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const characters = await listCharacters();
        const currentChar = characters.find(c => c.name === hero?.name);
        if (currentChar) {
          setCharacterData(currentChar);
        }
      } catch (err) {
        console.error('[Character] Failed to load character data:', err);
      }
    };
    if (hero?.name) {
      loadCharacter();
    }
  }, [hero?.name]);

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
  // EXP remaining to next level (скільки ще треба опиту до нового лвл)
  const expRemaining = Math.max(0, expToNextDisplay - expCurrent);
  const expPercent = expToNextDisplay > 0 
    ? Math.min(100, Math.floor((expCurrent / expToNextDisplay) * 100)) 
    : 100;

  // -----------------------------
  // Statistics from heroJson
  // -----------------------------
  const heroJson = (hero as any)?.heroJson || {};
  const stats = typeof heroJson === 'object' ? heroJson : {};
  const karma = stats.karma || 0;
  const pk = stats.pk || 0;
  // 🔥 mobsKilled може бути як в hero, так і в heroJson - перевіряємо обидва місця
  const mobsKilled = (hero as any)?.mobsKilled ?? stats.mobsKilled ?? stats.mobs_killed ?? stats.killedMobs ?? stats.totalKills ?? 0;
  const pvpWins = stats.pvpWins || stats.pvp_wins || 0;
  const pvpLosses = stats.pvpLosses || stats.pvp_losses || 0;
  
  // Date of registration - get from characterData or stats
  const registrationDate = characterData?.createdAt || stats.registrationDate || stats.createdAt || null;

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
      <div
        className="flex flex-col items-center relative"
        style={{
          width: "360px",
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
            <div className="border-t border-dotted border-[#654321] pt-2 pb-2">
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

              <div className="text-[11px] text-yellow-300 mt-1 border-t border-dotted border-[#654321] pt-1">
                Профессия:{" "}
                {(() => {
                  const profId = normalizeProfessionId(profession as any);
                  const profDef = profId ? getProfessionDefinition(profId) : null;
                  return profDef?.label || profession || "Нет";
                })()}
              </div>
              
              {/* Бафи під професією */}
              <CharacterBuffs />
            </div>
            <div className="border-b border-dotted border-[#654321]"></div>
          </div>

          {/* КНОПКИ СПРАВА */}
          <div className="flex flex-col gap-1 text-right text-[10px] ml-2 border-y border-dotted border-[#654321] pt-2 pb-2">
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
        
        {/* Крапкова лінія під барами (від краю до краю) */}
        <div className="w-full border-t border-dotted border-[#654321] mt-2"></div>

        {/* ========================================================= */}
        {/*     СТОЛБЕЦ ПУНКТОВ — КАК ТЫ ПРОСИЛ                        */}
        {/* ========================================================= */}
        <div className="w-[330px] text-left text-[12px] text-[#d3d3d3] mt-4 space-y-1">

          <div className="border-b border-dotted border-[#654321] pb-1 flex items-center gap-2">
            <img src="/icons/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
            <span>Аденa: <span className="text-yellow-300">{adena}</span></span>
          </div>
          <div className="border-b border-dotted border-[#654321] pb-1 flex items-center gap-2">
            <img src="/icons/col (1).png" alt="Coin of Luck" className="w-3 h-3 object-contain" />
            <span>Coin of Luck: <span className="text-yellow-300">{coins}</span></span>
          </div>

          <div className="border-b border-dotted border-[#654321] pb-1 flex items-center gap-2">
            <img src="/icons/star.png" alt="Experience" className="w-3 h-3 object-contain" />
            <span>
              Опыт: <span className="text-orange-400">{formatNumber(expRemaining)}</span> / <span className="text-green-300">{formatNumber(expToNextDisplay)}</span>
            </span>
          </div>

          <div className="border-b border-dotted border-[#654321] pb-1 flex items-center gap-2">
            <img src="/icons/news.png" alt="SP" className="w-3 h-3 object-contain" />
            <span>
              SP: <span className="text-blue-300">{formatNumber(sp)}</span>
            </span>
          </div>

          <button
            onClick={() => navigate("/learned-skills")}
            className="mt-2 text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-dotted border-[#654321] pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/news.png" alt="Skills" className="w-3 h-3 object-contain" />
            <span>Умения</span>
          </button>
          <RecipeBookButton navigate={navigate} />
          <button
            onClick={() => setShowQuests(!showQuests)}
            className="text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-dotted border-[#654321] pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/news.png" alt="Quests" className="w-3 h-3 object-contain" />
            <span>Мои квесты</span>
          </button>

          <div className="mt-2 border-b border-dotted border-[#654321] pb-1 flex items-center gap-2">
            <img src="/icons/rate.png" alt="Ratings" className="w-3 h-3 object-contain" />
            <span>Рейтинги</span>
          </div>
          {sevenSealsRank !== null && (
            <button
              onClick={() => setShowSevenSealsModal(true)}
              className="text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-dotted border-[#654321] pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
            >
              <span className={sevenSealsRank === 1 ? "text-yellow-400" : sevenSealsRank === 2 ? "text-gray-300" : "text-orange-400"}>
                Победитель 7 печатей ({sevenSealsRank} место)
              </span>
            </button>
          )}
          <button
            onClick={() => navigate("/daily-quests")}
            className="text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-dotted border-[#654321] pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/battles.png" alt="Daily Quests" className="w-3 h-3 object-contain" />
            <span>Ежедневные задания</span>
          </button>

          <button
            onClick={() => navigate("/premium-account")}
            className="mt-2 text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-dotted border-[#654321] pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
          >
            <img src="/icons/coin.png" alt="Premium" className="w-3 h-3 object-contain" />
            <span>Премиум аккаунт (ускоренная прокачка)</span>
          </button>
        </div>

        {/* Социальный статус */}
        <div className="w-[330px] text-left text-[11px] text-[#d3d3d3] mt-4 border-t border-dotted border-[#654321] pt-3">
          <div className="font-semibold mb-2">Социальный статус</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span>Карма</span>
              <span className={karma >= 0 ? "text-green-400" : "text-red-400"}>{karma}</span>
            </div>
            <div className="flex justify-between">
              <span>Рек.</span>
              <span>0</span>
            </div>
            <div className="flex justify-between">
              <span>PK</span>
              <span className={pk === 0 ? "text-green-400" : "text-red-400"}>{pk}</span>
            </div>
            <div className="flex justify-between">
              <span>Ост. рек.</span>
              <span>0</span>
            </div>
            <div className="flex justify-between">
              <span>Убил мобов</span>
              <span>{mobsKilled}</span>
            </div>
            <div className="flex justify-between">
              <span>PvP побед/поражений</span>
              <span className={pvpWins > pvpLosses ? "text-green-400" : "text-gray-400"}>
                {pvpWins}/{pvpLosses}
              </span>
            </div>
          </div>
          {registrationDate && (
            <div className="mt-2 text-gray-500 text-[10px]">
              Рег-я: {new Date(registrationDate).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          )}
        </div>

        {/* Квести */}
        {showQuests && (
          <div className="w-full mt-4">
            <CharacterQuests />
          </div>
        )}

      </div>

      {/* Модалка бонусу 7 печатей */}
      {showSevenSealsModal && sevenSealsRank !== null && (
        <SevenSealsBonusModal
          rank={sevenSealsRank as 1 | 2 | 3}
          playerName={nickname}
          bonus={(hero as any)?.heroJson?.sevenSealsBonus}
          onClose={() => setShowSevenSealsModal(false)}
        />
      )}

      {/* Модалка статуса */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4" style={{ width: "260px" }}>
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
  );
}
