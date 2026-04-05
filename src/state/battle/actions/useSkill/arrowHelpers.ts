// src/state/battle/actions/useSkill/arrowHelpers.ts
// Helper функції для роботи зі стрілами для луків

import type { Hero, HeroInventoryItem } from "../../../../types/Hero";
import { itemsDB } from "../../../../data/items/itemsDB";
import type { ItemDefinition } from "../../../../data/items/itemsDB.types";
import { getWeaponTypeFromEquipment } from "../../../../utils/stats/applyPassiveSkills";
import { inferGradeFromItemId } from "../../../../utils/itemGrade";

function gradeFromItemsDb(def: ItemDefinition | undefined): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  const g = def?.grade;
  return g ?? null;
}

/**
 * Визначає грейд зброї за itemId (спочатку itemsDB — інакше Spirit's Staff / Dasparion's дають хибний S через _s_ у назві)
 */
export function getWeaponGrade(itemId: string | null | undefined): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  if (!itemId) return null;

  const raw = itemId;
  const id = raw.toLowerCase();
  const candidates = [raw, id, id.replace(/^shop_/, ""), id.startsWith("shop_") ? id : `shop_${id}`];
  for (const key of candidates) {
    const g = gradeFromItemsDb(itemsDB[key]);
    if (g) return g;
  }

  const idLo = id;
  // Зброя типу weapon_iron_hammer_ng, weapon_sword_d — грейд в кінці
  if (idLo.endsWith("_ng")) return "NG";
  if (idLo.endsWith("_d")) return "D";
  if (idLo.endsWith("_c")) return "C";
  if (idLo.endsWith("_b")) return "B";
  if (idLo.endsWith("_a")) return "A";
  if (idLo.endsWith("_s")) return "S";
  const inferred = inferGradeFromItemId(idLo);
  if (inferred) return inferred as "NG" | "D" | "C" | "B" | "A" | "S";

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
  
  const weaponId = hero.equipment?.weapon ?? hero.equipment?.lrhand;
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

