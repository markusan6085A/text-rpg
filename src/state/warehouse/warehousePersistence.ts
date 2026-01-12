// src/state/warehouse/warehousePersistence.ts
import type { HeroInventoryItem } from "../../types/Hero";
import { getJSON, setJSON } from "../persistence";

const WAREHOUSE_KEY_PREFIX = "l2_warehouse_";
const WAREHOUSE_MAX_SLOTS = 10;

/**
 * Отримує ключ для зберігання складу для конкретного героя та слота
 */
function getWarehouseSlotKey(heroName: string, slotIndex: number): string {
  return `${WAREHOUSE_KEY_PREFIX}${heroName}_slot_${slotIndex}`;
}

/**
 * Зберігає предмет на склад (в окремий файл для кожного слота)
 */
export function saveItemToWarehouse(
  heroName: string,
  slotIndex: number,
  item: HeroInventoryItem | null
): void {
  if (slotIndex < 0 || slotIndex >= WAREHOUSE_MAX_SLOTS) {
    console.error(`[Warehouse] Invalid slot index: ${slotIndex}`);
    return;
  }

  const key = getWarehouseSlotKey(heroName, slotIndex);
  if (item) {
    setJSON(key, item);
  } else {
    // Видаляємо предмет зі складу
    setJSON(key, null);
  }
}

/**
 * Завантажує предмет зі складу
 */
export function loadItemFromWarehouse(
  heroName: string,
  slotIndex: number
): HeroInventoryItem | null {
  if (slotIndex < 0 || slotIndex >= WAREHOUSE_MAX_SLOTS) {
    return null;
  }

  const key = getWarehouseSlotKey(heroName, slotIndex);
  return getJSON<HeroInventoryItem | null>(key, null);
}

/**
 * Завантажує весь склад (всі 10 слотів)
 */
export function loadWarehouse(heroName: string): (HeroInventoryItem | null)[] {
  const warehouse: (HeroInventoryItem | null)[] = [];
  for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
    warehouse.push(loadItemFromWarehouse(heroName, i));
  }
  return warehouse;
}

/**
 * Очищає весь склад
 */
export function clearWarehouse(heroName: string): void {
  for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
    saveItemToWarehouse(heroName, i, null);
  }
}


