// Re-export функцій для зворотної сумісності
// Всі функції тепер в окремих модулях для кращої організації коду

export { equipItemLogic } from "./equipItem";
export { unequipItemLogic } from "./unequipItem";
export { isTwoHandedWeapon, getRequiredLevelForGrade } from "./weaponUtils";

// Типи для зворотної сумісності
import type { Hero, HeroInventoryItem } from "../../types/Hero";

/**
 * Цей файл залишається для зворотної сумісності.
 * Всі функції експортуються з нових модулів:
 * 
 * - equipItem.ts - логіка одягання предметів
 * - unequipItem.ts - логіка зняття предметів
 * - weaponUtils.ts - утиліти для роботи зі зброєю (isTwoHandedWeapon, getRequiredLevelForGrade)
 * - slotUtils.ts - утиліти для роботи зі слотами (normalizeSlot, autoSelectEarringOrRingSlot)
 */
