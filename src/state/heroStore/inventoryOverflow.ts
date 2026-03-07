/**
 * Логіка overflow-інвентаря: коли інвентар заповнений до max-1, решта предметів йде в сундук переповнення.
 */
import type { Hero, HeroInventoryItem } from "../../types/Hero";
import { getInventoryMax, OVERFLOW_CHEST_ID } from "../heroStore";
import { itemsDB } from "../../data/items/itemsDB";

const STACKABLE_SLOTS = new Set(["consumable", "resource", "quest"]);

/** Скільки звичайних слотів (без сундука). Сундук займає останній слот. */
export function getEffectiveMaxNormal(hero: { inventoryCapacity?: number } | null): number {
  return Math.max(1, getInventoryMax(hero) - 1);
}

/** Чи є предмет стакабельним */
function canStack(item: HeroInventoryItem): boolean {
  const def = itemsDB[item.id];
  return def ? STACKABLE_SLOTS.has(def.slot) : false;
}

export interface AddItemsResult {
  inventory: HeroInventoryItem[];
  overflowChest: HeroInventoryItem[];
}

/**
 * Додає предмети до інвентаря з overflow: спочатку заповнює інвентар до max-1, решту в overflowChest.
 */
export function addItemsWithOverflow(
  hero: Hero,
  itemsToAdd: HeroInventoryItem[]
): AddItemsResult {
  const maxNormal = getEffectiveMaxNormal(hero);
  let inventory = [...(hero.inventory || [])].filter((i) => i.id !== OVERFLOW_CHEST_ID);
  let overflowChest = [...(hero.overflowChest || [])];

  for (const toAdd of itemsToAdd) {
    const count = toAdd.count ?? 1;
    const stackable = canStack(toAdd);

    if (stackable) {
      const idx = inventory.findIndex((i) => i.id === toAdd.id);
      if (idx >= 0) {
        const cur = inventory[idx];
        inventory[idx] = { ...cur, count: (cur.count ?? 1) + count };
        continue;
      }
      // Стакабельний, але немає в інвентарі — 1 слот на весь стак
      if (inventory.length < maxNormal) {
        inventory.push({ ...toAdd, count });
      } else {
        overflowChest.push({ ...toAdd, count });
      }
      continue;
    }

    // Не стакається — кожен екземпляр = 1 слот
    for (let i = 0; i < count; i++) {
      const single: HeroInventoryItem = { ...toAdd, count: 1 };
      if (inventory.length < maxNormal) {
        inventory.push(single);
      } else {
        overflowChest.push(single);
      }
    }
  }

  // Стакаємо overflowChest по id для стакабельних
  const overflowMap = new Map<string, HeroInventoryItem>();
  overflowChest.forEach((item) => {
    const key = item.id;
    if (canStack(item)) {
      const cur = overflowMap.get(key);
      if (cur) {
        cur.count = (cur.count ?? 1) + (item.count ?? 1);
      } else {
        overflowMap.set(key, { ...item, count: item.count ?? 1 });
      }
    } else {
      overflowMap.set(`${key}_${Date.now()}_${Math.random()}`, item);
    }
  });
  overflowChest = Array.from(overflowMap.values());

  return { inventory, overflowChest };
}

/**
 * Вивантажує предмети з overflowChest в інвентар (до заповнення).
 */
export function unloadOverflowChest(hero: Hero): { inventory: HeroInventoryItem[]; overflowChest: HeroInventoryItem[] } {
  const maxNormal = getEffectiveMaxNormal(hero);
  let inventory = [...(hero.inventory || [])].filter((i) => i.id !== OVERFLOW_CHEST_ID);
  const overflowChest = [...(hero.overflowChest || [])];
  const newOverflow: HeroInventoryItem[] = [];

  for (const item of overflowChest) {
    if (inventory.length >= maxNormal) {
      newOverflow.push(item);
      continue;
    }
    const stackable = canStack(item);
    const total = item.count ?? 1;

    if (stackable) {
      const idx = inventory.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const cur = inventory[idx];
        inventory[idx] = { ...cur, count: (cur.count ?? 1) + total };
      } else if (inventory.length < maxNormal) {
        inventory.push({ ...item, count: total });
      } else {
        newOverflow.push(item);
      }
    } else {
      let moved = 0;
      for (let i = 0; i < total && inventory.length < maxNormal; i++) {
        inventory.push({ ...item, count: 1 });
        moved++;
      }
      if (moved < total) {
        newOverflow.push({ ...item, count: total - moved });
      }
    }
  }

  return { inventory, overflowChest: newOverflow };
}
