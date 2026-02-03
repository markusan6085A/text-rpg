// src/screens/character/DailyQuests.tsx
import React, { useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { DAILY_QUESTS, type DailyQuest } from "../../data/dailyQuests";

interface Navigate {
  (path: string): void;
}

export default function DailyQuests({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  // Перевіряємо, чи потрібно скинути щоденні завдання (якщо змінився день) — використовуємо локальну дату
  useEffect(() => {
    if (!hero) return;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; // YYYY-MM-DD (локально)
    const resetDate = hero.dailyQuestsResetDate;
    
    if (resetDate !== today) {
      // Скидаємо прогрес та завершені завдання
      updateHero({
        dailyQuestsProgress: {},
        dailyQuestsCompleted: [],
        dailyQuestsResetDate: today,
      });
    }
  }, [hero, updateHero]);

  if (!hero) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const progress = hero.dailyQuestsProgress || {};
  const completed = hero.dailyQuestsCompleted || [];

  // Обчислюємо поточний прогрес для кожного завдання
  const getQuestProgress = (quest: DailyQuest): number => {
    const currentProgress = progress[quest.id] || 0;
    return Math.min(currentProgress, quest.target);
  };

  // Перевіряємо, чи завдання завершене
  const isQuestCompleted = (quest: DailyQuest): boolean => {
    return completed.includes(quest.id) || getQuestProgress(quest) >= quest.target;
  };

  // Функція для завершення завдання
  const completeQuest = (quest: DailyQuest) => {
    // Отримуємо актуальний стан
    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;
    
    const currentProgress = progress[quest.id] || 0;
    const currentCompleted = currentHero.dailyQuestsCompleted || [];
    
    // Перевіряємо, чи завдання вже завершене
    if (currentCompleted.includes(quest.id) || currentProgress >= quest.target) {
      return;
    }
    
    // Перевіряємо, чи прогрес достатній для завершення
    if (currentProgress < quest.target) {
      return;
    }

    const rewards = quest.rewards || {};
    let newAdena = currentHero.adena || 0;
    let newExp = currentHero.exp || 0;
    let newSp = currentHero.sp || 0;
    let newCoinOfLuck = currentHero.coinOfLuck || 0;

    // Додаємо нагороди
    if (rewards.adena) {
      newAdena += rewards.adena;
    }
    if (rewards.exp) {
      newExp += rewards.exp;
    }
    if (rewards.sp) {
      newSp += rewards.sp;
    }
    if (rewards.coinOfLuck) {
      newCoinOfLuck += rewards.coinOfLuck;
    }

    // Оновлюємо героя
    updateHero({
      adena: newAdena,
      exp: newExp,
      sp: newSp,
      coinOfLuck: newCoinOfLuck,
      dailyQuestsCompleted: [...currentCompleted, quest.id],
    });
  };

  return (
    <div className="w-full text-[#f4e2b8] px-1 py-2">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/character")}
          className="text-gray-400 text-xs hover:text-gray-300"
        >
          ← Назад
        </button>
        <div className="text-[#ffd700] text-xs border-b border-dotted border-gray-500 pb-2 font-semibold flex-1" style={{ textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}>
          Ежедневные задания
        </div>
      </div>

      {/* Список щоденних завдань */}
      {DAILY_QUESTS.length > 0 ? (
        <div className="space-y-2">
          {DAILY_QUESTS.map((quest) => {
            const currentProgress = getQuestProgress(quest);
            const completed = isQuestCompleted(quest);
            const canComplete = currentProgress >= quest.target && !completed;

            return (
              <div
                key={quest.id}
                className={`border-b border-dotted border-gray-500 py-2 ${completed ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {quest.icon && (
                    <img src={quest.icon} alt={quest.name} className="w-4 h-4 object-contain" />
                  )}
                  <span className="text-orange-400 text-xs font-semibold">{quest.name}</span>
                  {completed && (
                    <span className="text-green-400 text-[10px] ml-2">✓ Завершено</span>
                  )}
                </div>
                <div className="text-gray-400 text-[11px] mb-2">
                  {quest.description}
                </div>
                
                {/* Прогрес */}
                <div className="text-[#b8860b]/60 text-[10px] mb-2">
                  <div className="font-semibold mb-1">Прогрес:</div>
                  <div className="ml-2">
                    {currentProgress.toLocaleString("ru-RU")} / {quest.target.toLocaleString("ru-RU")}
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${completed ? "bg-green-500" : "bg-yellow-500"}`}
                        style={{ width: `${Math.min(100, (currentProgress / quest.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Нагороди */}
                {quest.rewards && (
                  <div className="text-[#ff8c00] text-[10px] mb-2">
                    <span className="font-semibold">Нагороди: </span>
                    {quest.rewards.exp && <span>EXP: {quest.rewards.exp.toLocaleString("ru-RU")} </span>}
                    {quest.rewards.adena && <span>Адена: {quest.rewards.adena.toLocaleString("ru-RU")} </span>}
                    {quest.rewards.sp && <span>SP: {quest.rewards.sp.toLocaleString("ru-RU")} </span>}
                    {quest.rewards.coinOfLuck && <span>Coin of Luck: {quest.rewards.coinOfLuck} </span>}
                  </div>
                )}

                {/* Кнопка завершення */}
                {canComplete && (
                  <button
                    className="mt-2 px-3 py-1 text-[10px] bg-[#0f0a06] text-green-400 border border-[#3e301c] rounded-md hover:bg-[#1a1208]"
                    onClick={() => completeQuest(quest)}
                  >
                    Завершити завдання
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[#b8860b]/60 text-xs text-center py-4">
          Поки що немає доступних щоденних завдань.
        </div>
      )}
    </div>
  );
}

