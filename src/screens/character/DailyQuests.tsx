// src/screens/character/DailyQuests.tsx
// Ежедневные задания — один екран, мінімум логіки ресету
import React, { useEffect, useRef } from "react";
import { useHeroStore } from "../../state/heroStore";
import { DAILY_QUESTS, type DailyQuest } from "../../data/dailyQuests";

interface Navigate {
  (path: string): void;
}

const WARSAW_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

function getTodayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", WARSAW_DATE_OPTIONS).format(new Date());
}

function isYYYYMMDD(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function DailyQuests({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const lastResetCheck = useRef<string | null>(null);

  // Ресет тільки коли справді новий день. Не чіпаємо прогрес, якщо дата не валідна або вже сьогодні.
  useEffect(() => {
    if (!hero?.id) return;

    const today = getTodayWarsaw();
    const raw = hero.dailyQuestsResetDate;
    const resetDate =
      typeof raw === "string" && raw.length >= 10
        ? String(raw).slice(0, 10)
        : "";

    // Вже перевіряли сьогодні — не викликаємо updateHero знову
    if (lastResetCheck.current === today) return;

    if (!resetDate || !isYYYYMMDD(resetDate)) {
      lastResetCheck.current = today;
      updateHero({ dailyQuestsResetDate: today });
      return;
    }

    if (resetDate < today) {
      lastResetCheck.current = today;
      updateHero({
        dailyQuestsProgress: {},
        dailyQuestsCompleted: [],
        dailyQuestsResetDate: today,
      });
    } else {
      lastResetCheck.current = today;
    }
  }, [hero?.id, hero?.dailyQuestsResetDate, updateHero]);

  // Автоматично видати нагороди за щоденні завдання, які вже виконані (прогрес >= цілі), але ще не отримані
  useEffect(() => {
    if (!hero) return;
    const progress = hero.dailyQuestsProgress ?? {};
    const done = hero.dailyQuestsCompleted ?? [];
    let rewardAdena = 0;
    let rewardExp = 0;
    let rewardSp = 0;
    let rewardCoinOfLuck = 0;
    const toComplete: string[] = [];
    for (const quest of DAILY_QUESTS) {
      const cur = progress[quest.id] ?? 0;
      if (cur >= quest.target && !done.includes(quest.id)) {
        toComplete.push(quest.id);
        rewardAdena += quest.rewards.adena ?? 0;
        rewardExp += quest.rewards.exp ?? 0;
        rewardSp += quest.rewards.sp ?? 0;
        rewardCoinOfLuck += quest.rewards.coinOfLuck ?? 0;
      }
    }
    if (toComplete.length === 0) return;
    const newCompleted = [...done, ...toComplete];
    updateHero({
      adena: (hero.adena ?? 0) + rewardAdena,
      exp: Math.floor(Number(hero.exp ?? 0)) + rewardExp,
      sp: (hero.sp ?? 0) + rewardSp,
      dailyQuestsCompleted: newCompleted,
      ...(rewardCoinOfLuck > 0 ? { coinOfLuck: ((hero as any).coinOfLuck ?? 0) + rewardCoinOfLuck } : {}),
    });
  }, [hero?.id, hero?.dailyQuestsProgress, hero?.dailyQuestsCompleted, updateHero]);

  if (!hero) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const progress = hero.dailyQuestsProgress ?? {};
  const completed = hero.dailyQuestsCompleted ?? [];

  const getQuestProgress = (quest: DailyQuest): number => {
    const v = progress[quest.id];
    const n = typeof v === "number" && !Number.isNaN(v) ? v : 0;
    return Math.min(n, quest.target);
  };

  const isQuestCompleted = (quest: DailyQuest): boolean =>
    completed.includes(quest.id) || getQuestProgress(quest) >= quest.target;

  const completeQuest = (quest: DailyQuest) => {
    const h = useHeroStore.getState().hero;
    if (!h) return;
    const cur = h.dailyQuestsProgress?.[quest.id] ?? 0;
    const done = h.dailyQuestsCompleted ?? [];
    if (done.includes(quest.id) || cur < quest.target) return;

    const r = quest.rewards ?? {};
    updateHero({
      adena: (h.adena ?? 0) + (r.adena ?? 0),
      exp: (h.exp ?? 0) + (r.exp ?? 0),
      sp: (h.sp ?? 0) + (r.sp ?? 0),
      coinOfLuck: (h.coinOfLuck ?? 0) + (r.coinOfLuck ?? 0),
      dailyQuestsCompleted: [...done, quest.id],
    });
  };

  return (
    <div className="w-full text-[#f4e2b8] px-1 py-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigate("/character")}
          className="text-gray-400 text-xs hover:text-gray-300"
        >
          ← Назад
        </button>
        <div
          className="text-[#ffd700] text-xs border-b border-solid border-white/50 pb-2 font-semibold flex-1"
          style={{ textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
        >
          Ежедневные задания
        </div>
      </div>

      {DAILY_QUESTS.length > 0 ? (
        <div className="space-y-2">
          {DAILY_QUESTS.map((quest) => {
            const currentProgress = getQuestProgress(quest);
            const done = isQuestCompleted(quest);
            const canComplete = currentProgress >= quest.target && !done;

            return (
              <div
                key={quest.id}
                className={`border-b border-solid border-white/50 py-2 ${done ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {quest.icon && (
                    <img src={quest.icon} alt={quest.name} className="w-4 h-4 object-contain" />
                  )}
                  <span className="text-orange-400 text-xs font-semibold">{quest.name}</span>
                  {done && (
                    <span className="text-green-400 text-[10px] ml-2">✓ Завершено</span>
                  )}
                </div>
                <div className="text-gray-400 text-[11px] mb-2">{quest.description}</div>
                <div className="text-[#b8860b]/60 text-[10px] mb-2">
                  <div className="font-semibold mb-1">Прогрес:</div>
                  <div className="ml-2">
                    {currentProgress.toLocaleString("ru-RU")} / {quest.target.toLocaleString("ru-RU")}
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${done ? "bg-green-500" : "bg-yellow-500"}`}
                        style={{
                          width: `${Math.min(100, (currentProgress / quest.target) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                {quest.rewards && (
                  <div className="text-[#ff8c00] text-[10px] mb-2">
                    <span className="font-semibold">Нагороди: </span>
                    {quest.rewards.exp && (
                      <span>EXP: {quest.rewards.exp.toLocaleString("ru-RU")} </span>
                    )}
                    {quest.rewards.adena && (
                      <span>Адена: {quest.rewards.adena.toLocaleString("ru-RU")} </span>
                    )}
                    {quest.rewards.sp && (
                      <span>SP: {quest.rewards.sp.toLocaleString("ru-RU")} </span>
                    )}
                    {quest.rewards.coinOfLuck && (
                      <span>Coin of Luck: {quest.rewards.coinOfLuck} </span>
                    )}
                  </div>
                )}
                {canComplete && (
                  <button
                    className="mt-2 px-3 py-1 text-[10px] bg-[#0f0a06] text-green-400 border border-white/50 rounded-md hover:bg-[#1a1208]"
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
