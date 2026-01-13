/**
 * Маппінг предметів з itemsDB до ID файлів екіпірування
 * 
 * Формат: { itemId: equipmentFileId }
 * Де equipmentFileId - це число, яке відповідає файлу {equipmentFileId}.png
 * в папці equipment/{view}/{raceId}-{gender}/
 */

/**
 * Маппінг предметів з itemsDB до ID файлів екіпірування
 * 
 * ВАЖЛИВО: Ці ID потрібно налаштувати відповідно до реальних файлів
 * в папці equipment/{view}/{raceId}-{gender}/
 * 
 * Формат файлів: {equipmentFileId}.png
 * Наприклад: 0.png, 1.png, 100.png
 * 
 * Щоб знайти правильні ID:
 * 1. Подивіться на файли в папці equipment/front/0-male/
 * 2. Визначте, який файл відповідає якому предмету
 * 3. Оновіть цей маппінг
 */
export const ITEM_EQUIPMENT_MAPPING: Record<string, number> = {
  // NG ARMOR
  // TODO: Вказати правильні ID файлів екіпірування
  ng_helmet_leather: 0, // Приклад - потрібно вказати правильні ID
  ng_armor_leather: 1,
  ng_gaiters_leather: 2,
  ng_gloves_leather: 3,
  ng_boots_leather: 4,

  // NG WEAPONS
  // (видалено старі предмети з плейсхолдерами)

  // NG SHIELDS
  leather_shield: 20,

  // D-GRADE ARMOR
  d_helmet_leather: 100,
  d_armor_leather: 101,
  d_gaiters_leather: 102,
  d_gloves_leather: 103,
  d_boots_leather: 104,

  // D-GRADE WEAPONS
  // (видалено старі предмети з плейсхолдерами)
};

/**
 * Отримує ID файлу екіпірування для предмета
 * @param itemId - ID предмета з itemsDB
 * @returns ID файлу екіпірування або null, якщо маппінг не знайдено
 */
export function getEquipmentFileId(itemId: string): number | null {
  return ITEM_EQUIPMENT_MAPPING[itemId] ?? null;
}

/**
 * Перевіряє, чи є зображення екіпірування для предмета
 */
export function hasEquipmentImage(itemId: string): boolean {
  return itemId in ITEM_EQUIPMENT_MAPPING;
}

