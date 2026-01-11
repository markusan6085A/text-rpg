// src/state/battle/actions/useSkill/arrowHelpers.ts
// Helper функції для роботи зі стрілами для луків

import type { Hero, HeroInventoryItem } from "../../../../types/Hero";
import { itemsDB } from "../../../../data/items/itemsDB";
import { getWeaponTypeFromEquipment } from "../../../../utils/stats/applyPassiveSkills";

/**
 * Визначає грейд зброї за itemId
 */
export function getWeaponGrade(itemId: string | null | undefined): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  if (!itemId) return null;
  
  const id = itemId.toLowerCase();
  if (id.startsWith("s_") || id.includes("_s_")) return "S";
  if (id.startsWith("a_") || id.includes("_a_")) return "A";
  if (id.startsWith("b_") || id.includes("_b_")) return "B";
  if (id.startsWith("c_") || id.includes("_c_")) return "C";
  if (id.startsWith("d_") || id.includes("_d_")) return "D";
  if (id.startsWith("ng_") || id.includes("_ng_")) return "NG";
  
  return null;
}

/**
 * Перевіряє, чи одягнутий лук
 */
export function isBowEquipped(hero: Hero): boolean {
  const weaponType = getWeaponTypeFromEquipment(hero.equipment);
  return weaponType === "bow";
}

/**
 * Отримує ID стріл для грейду
 */
export function getArrowIdForGrade(grade: "NG" | "D" | "C" | "B" | "A" | "S"): string {
  const arrowMap: Record<string, string> = {
    "NG": "wooden_arrow",
    "D": "bone_arrow",
    "C": "fine_steel_arrow",
    "B": "silver_arrow",
    "A": "mithril_arrow",
    "S": "shining_arrow",
  };
  return arrowMap[grade] || "wooden_arrow";
}

/**
 * Перевіряє наявність стріл відповідного грейду в інвентарі
 */
export function hasArrows(hero: Hero, grade: "NG" | "D" | "C" | "B" | "A" | "S" | null): boolean {
  if (!grade) return false;
  
  const arrowId = getArrowIdForGrade(grade);
  const inventory = hero.inventory || [];
  
  const arrowItem = inventory.find((item: HeroInventoryItem) => item.id === arrowId);
  if (!arrowItem) return false;
  
  const count = arrowItem.count ?? 0;
  return count > 0;
}

/**
 * Використовує одну стрілу (віднімає з інвентаря)
 */
export function useArrow(hero: Hero, grade: "NG" | "D" | "C" | "B" | "A" | "S" | null): { success: boolean; updatedInventory: HeroInventoryItem[] } {
  if (!grade) {
    return { success: false, updatedInventory: hero.inventory || [] };
  }
  
  const arrowId = getArrowIdForGrade(grade);
  const inventory = [...(hero.inventory || [])];
  
  const arrowIndex = inventory.findIndex((item: HeroInventoryItem) => item.id === arrowId);
  if (arrowIndex === -1) {
    return { success: false, updatedInventory: inventory };
  }
  
  const arrowItem = inventory[arrowIndex];
  const currentCount = arrowItem.count ?? 0;
  
  if (currentCount <= 0) {
    return { success: false, updatedInventory: inventory };
  }
  
  // Віднімаємо одну стрілу
  const newCount = currentCount - 1;
  if (newCount <= 0) {
    // Видаляємо предмет, якщо стріл не залишилось
    inventory.splice(arrowIndex, 1);
  } else {
    // Оновлюємо кількість
    inventory[arrowIndex] = {
      ...arrowItem,
      count: newCount,
    };
  }
  
  return { success: true, updatedInventory: inventory };
}

/**
 * Перевіряє, чи може герой атакувати з луком (є стріли)
 */
export function canAttackWithBow(hero: Hero): { canAttack: boolean; message?: string; grade?: "NG" | "D" | "C" | "B" | "A" | "S" | null } {
  if (!isBowEquipped(hero)) {
    return { canAttack: true }; // Не лук, перевірка не потрібна
  }
  
  const weaponId = hero.equipment?.weapon;
  const weaponGrade = getWeaponGrade(weaponId);
  
  if (!weaponGrade) {
    return { canAttack: false, message: "Не удалось определить грейд лука." };
  }
  
  const hasArrowsForBow = hasArrows(hero, weaponGrade);
  
  if (!hasArrowsForBow) {
    const arrowName = itemsDB[getArrowIdForGrade(weaponGrade)]?.name || "стріл";
    return { 
      canAttack: false, 
      message: `У вас нет ${arrowName} для лука!`,
      grade: weaponGrade 
    };
  }
  
  return { canAttack: true, grade: weaponGrade };
}

