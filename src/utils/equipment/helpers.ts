/**
 * Допоміжні функції для роботи з екіпіруванням
 */

import { getEquipmentFileId } from "./itemEquipmentMapping";
import { getRaceId, getGenderSuffix } from "./raceMapping";
import { ITEM_EQUIPMENT_MAPPING } from "./itemEquipmentMapping";

/**
 * Перевіряє, чи існує зображення екіпірування для предмета
 * (корисно для відображення підказок або fallback)
 */
export function checkEquipmentExists(
  itemId: string,
  race: string,
  gender: string,
  view: "front" | "back" | "top" = "front"
): boolean {
  const fileId = getEquipmentFileId(itemId);
  if (!fileId) return false;

  // В браузері можна перевірити через fetch, але це асинхронно
  // Тут просто перевіряємо, чи є маппінг
  return true;
}

/**
 * Отримує список всіх предметів, для яких є екіпірування
 */
export function getItemsWithEquipment(): string[] {
  // Можна використати для відображення списку доступних предметів
  return Object.keys(ITEM_EQUIPMENT_MAPPING);
}

/**
 * Формує повідомлення про помилку, якщо екіпірування не знайдено
 */
export function getEquipmentErrorMessage(
  itemId: string,
  race: string,
  gender: string
): string | null {
  const fileId = getEquipmentFileId(itemId);
  if (!fileId) {
    return `Екіпірування не знайдено для предмета: ${itemId}`;
  }

  const raceId = getRaceId(race);
  const genderSuffix = getGenderSuffix(gender);
  const expectedPath = `/equipment/front/${raceId}-${genderSuffix}/${fileId}.png`;

  return `Очікуваний шлях: ${expectedPath}`;
}

