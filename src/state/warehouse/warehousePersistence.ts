// src/state/warehouse/warehousePersistence.ts
import type { HeroInventoryItem } from "../../types/Hero";
import { getJSON, setJSON } from "../persistence";

const WAREHOUSE_KEY_PREFIX = "l2_warehouse_";
/** Скільки фізичних комірок у localStorage (узгоджено з Warehouse.tsx). */
export const WAREHOUSE_MAX_SLOTS = 10;

/**
 * Ключ складу: по characterId (не по імені), щоб склад не губився при зміні ніка.
 */
function getWarehouseSlotKey(characterId: string, slotIndex: number): string {
  return `${WAREHOUSE_KEY_PREFIX}${characterId}_slot_${slotIndex}`;
}

function getWarehouseSlotKeyLegacy(heroName: string, slotIndex: number): string {
  return `${WAREHOUSE_KEY_PREFIX}${heroName}_slot_${slotIndex}`;
}

/**
 * Зберігає предмет на склад (по characterId).
 */
export function saveItemToWarehouse(
  characterId: string,
  slotIndex: number,
  item: HeroInventoryItem | null
): void {
  if (slotIndex < 0 || slotIndex >= WAREHOUSE_MAX_SLOTS) {
    console.error(`[Warehouse] Invalid slot index: ${slotIndex}`);
    return;
  }

  const key = getWarehouseSlotKey(characterId, slotIndex);
  if (item) {
    setJSON(key, item);
  } else {
    setJSON(key, null);
  }
}

/**
 * Завантажує предмет зі складу по characterId.
 */
export function loadItemFromWarehouse(
  characterId: string,
  slotIndex: number
): HeroInventoryItem | null {
  if (slotIndex < 0 || slotIndex >= WAREHOUSE_MAX_SLOTS) {
    return null;
  }

  const key = getWarehouseSlotKey(characterId, slotIndex);
  return getJSON<HeroInventoryItem | null>(key, null);
}

const LEGACY_CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver"]);

/**
 * Завантажує весь склад по characterId.
 * Якщо по characterId порожньо — пробує legacy-ключ по heroName (міграція після зміни ніка/коду).
 * Legacy-валюта в полях героя (adena/coin_of_luck/coins_silver) — прибираємо з комірок. Ancient Adena — стек у інвентарі/складі, не чіпаємо.
 */
export function loadWarehouse(
  characterId: string,
  heroNameFallback?: string
): (HeroInventoryItem | null)[] {
  const warehouse: (HeroInventoryItem | null)[] = [];
  for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
    let item = getJSON<HeroInventoryItem | null>(
      getWarehouseSlotKey(characterId, i),
      null
    );
    if (item && LEGACY_CURRENCY_IDS.has((item as any).id || (item as any).itemId || "")) {
      saveItemToWarehouse(characterId, i, null);
      item = null;
    }
    warehouse.push(item);
  }

  const isEmpty = warehouse.every((s) => s == null);
  if (isEmpty && heroNameFallback) {
    for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
      const legacy = getJSON<HeroInventoryItem | null>(
        getWarehouseSlotKeyLegacy(heroNameFallback, i),
        null
      );
      if (legacy) {
        warehouse[i] = legacy;
        saveItemToWarehouse(characterId, i, legacy);
      }
    }
  }

  return warehouse;
}

/**
 * Очищає весь склад по characterId.
 */
export function clearWarehouse(characterId: string): void {
  for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
    saveItemToWarehouse(characterId, i, null);
  }
}

/**
 * Після завантаження героя з API: якщо локальні ключі складу порожні (нова вкладка / очищення cookie),
 * відновити комірки з heroJson.warehouseSlots. Якщо локальний склад уже не порожній — не перезаписуємо.
 */
export function seedWarehouseFromHeroJsonIfStorageEmpty(
  characterId: string | undefined,
  slots: unknown,
  heroNameFallback?: string
): void {
  const id = typeof characterId === "string" && characterId.trim().length > 0 ? characterId.trim() : "";
  if (!id) return;
  const current = loadWarehouse(id, heroNameFallback);
  const hasLocal = current.some((x) => x != null);
  if (hasLocal) return;
  if (!Array.isArray(slots) || slots.length === 0) return;
  for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
    const raw = slots[i];
    if (raw != null && typeof raw === "object") {
      saveItemToWarehouse(id, i, raw as HeroInventoryItem);
    } else {
      saveItemToWarehouse(id, i, null);
    }
  }
}


