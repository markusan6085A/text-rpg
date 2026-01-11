// src/utils/dailyQuests/updateDailyQuestProgress.ts
import type { Hero } from "../../types/Hero";

/**
 * Оновлює прогрес щоденних завдань
 * @param hero - поточний герой
 * @param questId - ID завдання
 * @param amount - кількість для додавання до прогресу
 * @returns оновлений прогрес
 */
export function updateDailyQuestProgress(
  hero: Hero,
  questId: string,
  amount: number
): Record<string, number> {
  const currentProgress = hero.dailyQuestsProgress || {};
  const currentValue = currentProgress[questId] || 0;
  const completed = hero.dailyQuestsCompleted || [];
  
  // Якщо завдання вже завершене, не оновлюємо
  if (completed.includes(questId)) {
    return currentProgress;
  }
  
  return {
    ...currentProgress,
    [questId]: currentValue + amount,
  };
}

