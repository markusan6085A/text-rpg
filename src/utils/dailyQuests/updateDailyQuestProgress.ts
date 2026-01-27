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
  
  // Якщо завдання вже завершене, не оновлюємо - повертаємо той самий об'єкт
  if (completed.includes(questId)) {
    return currentProgress;
  }
  
  // Якщо значення не змінилося (amount === 0), повертаємо той самий об'єкт
  if (amount === 0) {
    return currentProgress;
  }
  
  // Повертаємо новий об'єкт з оновленим значенням
  return {
    ...currentProgress,
    [questId]: currentValue + amount,
  };
}

