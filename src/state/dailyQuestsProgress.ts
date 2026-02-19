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
