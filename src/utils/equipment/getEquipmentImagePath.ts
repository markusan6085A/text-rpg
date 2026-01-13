/**
 * Утиліта для отримання шляху до зображення екіпірування
 */

import { getRaceId, getGenderSuffix } from "./raceMapping";
import { getEquipmentFileId } from "./itemEquipmentMapping";

export type EquipmentView = "front" | "back" | "top";

interface GetEquipmentImagePathOptions {
  itemId: string;
  race: string;
  gender: string;
  view?: EquipmentView;
  basePath?: string;
}

/**
 * Отримує шлях до зображення екіпірування
 * 
 * @param options - Параметри для отримання шляху
 * @returns Шлях до зображення або null, якщо не знайдено
 * 
 * @example
 * getEquipmentImagePath({
 *   itemId: "ng_helmet_leather",
 *   race: "Human",
 *   gender: "male",
 *   view: "front"
 * })
 * // Поверне: "/equipment/front/0-male/0.png"
 */
export function getEquipmentImagePath({
  itemId,
  race,
  gender,
  view = "front",
  basePath = "/equipment",
}: GetEquipmentImagePathOptions): string | null {
  const equipmentFileId = getEquipmentFileId(itemId);
  if (equipmentFileId === null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Equipment] No mapping found for item: ${itemId}`);
    }
    return null;
  }

  const raceId = getRaceId(race);
  const genderSuffix = getGenderSuffix(gender);
  const folderPath = `${raceId}-${genderSuffix}`;

  const path = `${basePath}/${view}/${folderPath}/${equipmentFileId}.png`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Equipment] Path for ${itemId}: ${path}`);
  }

  return path;
}

/**
 * Отримує шлях до зображення екіпірування з зовнішньої папки
 * (для використання файлів з l2dop/img/equipment)
 */
export function getExternalEquipmentImagePath(
  itemId: string,
  race: string,
  gender: string,
  view: EquipmentView = "front"
): string | null {
  const equipmentFileId = getEquipmentFileId(itemId);
  if (equipmentFileId === null) {
    return null;
  }

  const raceId = getRaceId(race);
  const genderSuffix = getGenderSuffix(gender);
  const folderPath = `${raceId}-${genderSuffix}`;

  // Шлях до зовнішньої папки (потрібно буде скопіювати файли або налаштувати сервер)
  return `/l2dop/img/equipment/${view}/${folderPath}/${equipmentFileId}.png`;
}

