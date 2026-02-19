/**
 * Єдине місце для оновлення прогресу щоденних завдань.
 * Джерело правди: hero.dailyQuestsProgress у heroStore.
 */
import { useHeroStore } from "./heroStore";

/**
 * Додати amount до прогресу завдання questId.
 * Викликати після: урон по мобу, повідомлення в чаті, обмін в QuestShop.
 */
export function addDailyProgress(questId: string, amount: number): void {
  if (amount === 0) return;
  const hero = useHeroStore.getState().hero;
  if (!hero) return;

  const completed = hero.dailyQuestsCompleted ?? [];
  if (completed.includes(questId)) return;

  const cur = hero.dailyQuestsProgress ?? {};
  const prevVal = typeof cur[questId] === "number" ? cur[questId] : 0;
  const next: Record<string, number> = { ...cur, [questId]: prevVal + amount };

  useHeroStore.getState().updateHero({ dailyQuestsProgress: next });
}

/**
 * Після victory: одним викликом оновити daily_kills та daily_adena_farm від поточного hero.
 * Не чіпаємо daily_damage — його вже оновлено раніше.
 */
export function addDailyProgressVictory(kills: number, adena: number): void {
  if (kills === 0 && adena === 0) return;
  const hero = useHeroStore.getState().hero;
  if (!hero) return;

  const completed = hero.dailyQuestsCompleted ?? [];
  const cur = hero.dailyQuestsProgress ?? {};
  const next: Record<string, number> = { ...cur };

  if (kills > 0 && !completed.includes("daily_kills")) {
    next.daily_kills = (typeof cur.daily_kills === "number" ? cur.daily_kills : 0) + kills;
  }
  if (adena > 0 && !completed.includes("daily_adena_farm")) {
    next.daily_adena_farm = (typeof cur.daily_adena_farm === "number" ? cur.daily_adena_farm : 0) + adena;
  }

  if (next.daily_kills !== cur.daily_kills || next.daily_adena_farm !== cur.daily_adena_farm) {
    useHeroStore.getState().updateHero({ dailyQuestsProgress: next });
  }
}
