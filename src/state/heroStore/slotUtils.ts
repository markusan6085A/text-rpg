import type { HeroInventoryItem } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import type { Hero } from "../../types/Hero";

/**
 * Конвертує XML формат слотів в стандартний формат
 * rear;lear -> earring, rfinger;lfinger -> ring
 * lhand -> shield (для щитів)
 * lrhand -> weapon (для зброї, включаючи удочки)
 * chest -> armor (нагрудники зберігаються в equipment.armor)
 */
export function normalizeSlot(slot: string, item: HeroInventoryItem): string {
  if (slot === "chest") {
    return "armor";
  }
  if (slot.includes("rear") || slot.includes("lear") || slot === "rear;lear") {
    return "earring";
  } else if (slot.includes("rfinger") || slot.includes("lfinger") || slot === "rfinger;lfinger") {
    return "ring";
  } else if (slot === "lhand") {
    // Перевіряємо, чи це щит
    const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
    if (itemDef && (itemDef.kind === "shield" || itemDef.kind === "armor")) {
      return "shield";
    }
  } else if (slot === "lrhand") {
    const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
    if (itemDef && itemDef.kind === "weapon") {
      // Dual wield (dual sword, dual dagger) — залишаємо lrhand
      const id = (item.id || "").toLowerCase();
      const name = (itemDef.name || "").toLowerCase();
      if (id.includes("dual") || name.includes("dual")) return "lrhand";
      // Інша зброя (лук, посох) — weapon, дворучна піде в weapon+shield
      return "weapon";
    }
  }
  
  return slot;
}

/**
 * Автоматичне визначення слота для earring та ring
 * Дозволяємо одягати однакові предмети в різні слоти (наприклад, два однакові кільця)
 */
export function autoSelectEarringOrRingSlot(slot: string, hero: Hero): string {
  if (slot === "earring") {
    // Якщо earring_left вільний, одягаємо туди, інакше в earring_right
    if (!hero.equipment?.earring_left) {
      return "earring_left";
    } else if (!hero.equipment?.earring_right) {
      return "earring_right";
    } else {
      // Якщо обидва зайняті, замінюємо earring_left
      return "earring_left";
    }
  } else if (slot === "ring") {
    // Якщо ring_left вільний, одягаємо туди, інакше в ring_right
    if (!hero.equipment?.ring_left) {
      return "ring_left";
    } else if (!hero.equipment?.ring_right) {
      return "ring_right";
    } else {
      // Якщо обидва зайняті, замінюємо ring_left
      return "ring_left";
    }
  }
  
  return slot;
}
