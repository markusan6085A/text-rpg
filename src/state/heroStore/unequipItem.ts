import type { Hero } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { autoDetectArmorType, autoDetectGrade } from "../../utils/items/autoDetectArmorType";
import { isTwoHandedWeapon } from "./weaponUtils";

/**
 * Основна функція зняття предмета
 */
export function unequipItemLogic(hero: Hero, slot: string): Hero {
  if (!slot) return hero;

  const itemId = hero.equipment?.[slot];
  if (!itemId) return hero;

  const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
  if (!def) return hero;

  // Перевіряємо, чи це торс з 2 частин (robe), який займає обидва слоти (armor і legs)
  let isTwoPartTorso = false;
  let otherSlot: string | null = null;
  
  if (slot === "legs" || slot === "armor") {
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    
    if (armorItemId === legsItemId && armorItemId === itemId) {
      isTwoPartTorso = true;
      otherSlot = slot === "armor" ? "legs" : "armor";
      
      console.log(`[unequipItemLogic] 🔍 TWO-PART TORSO DETECTED:`, {
        slot,
        otherSlot,
        itemId,
        itemName: def.name,
      });
    }
  }
  
  // Перевіряємо, чи це дворучна зброя, яка займає обидва слоти (weapon і shield)
  let isTwoHandedWeaponInBothSlots = false;
  let twoHandedOtherSlot: string | null = null;
  
  if (slot === "weapon" || slot === "shield") {
    const weaponItemId = hero.equipment?.weapon;
    const shieldItemId = hero.equipment?.shield;
    
    const isTwoHandedItem = isTwoHandedWeapon(itemId);
    
    if (weaponItemId === shieldItemId && weaponItemId === itemId && isTwoHandedItem) {
      isTwoHandedWeaponInBothSlots = true;
      twoHandedOtherSlot = slot === "weapon" ? "shield" : "weapon";
      
      console.log(`[unequipItemLogic] 🔍 TWO-HANDED WEAPON DETECTED (weapon + shield):`, {
        slot,
        twoHandedOtherSlot,
        itemId,
        itemName: def.name,
      });
    }
  }

  const newInventory = [...(hero.inventory || [])];
  
  // Беремо рівень заточки зі слота
  const enchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 
    (isTwoPartTorso && otherSlot ? (hero.equipmentEnchantLevels?.[otherSlot] ?? 0) : 0) ??
    (isTwoHandedWeaponInBothSlots && twoHandedOtherSlot ? (hero.equipmentEnchantLevels?.[twoHandedOtherSlot] ?? 0) : 0);
  
  // Автоматично визначаємо grade та armorType
  const grade = def.grade || autoDetectGrade(itemId);
  const armorType = def.armorType || (def.kind === "armor" || def.kind === "helmet" || def.kind === "boots" || def.kind === "gloves" ? autoDetectArmorType(itemId) : undefined);

  // Додаємо предмет в інвентар тільки один раз
  if (!isTwoHandedWeaponInBothSlots && !isTwoPartTorso) {
    newInventory.push({
      id: def.id,
      name: def.name,
      slot: def.slot,
      kind: def.kind,
      icon: def.icon,
      description: def.description,
      stats: def.stats,
      count: 1,
      enchantLevel: enchantLevel,
      grade: grade,
      armorType: armorType,
    });
  } else if (isTwoHandedWeaponInBothSlots || isTwoPartTorso) {
    // Додаємо тільки один раз, якщо це дворучна зброя або торс з 2 частин
    newInventory.push({
      id: def.id,
      name: def.name,
      slot: def.slot,
      kind: def.kind,
      icon: def.icon,
      description: def.description,
      stats: def.stats,
      count: 1,
      enchantLevel: enchantLevel,
      grade: grade,
      armorType: armorType,
    });
    console.log(`[unequipItemLogic] ✅ ${isTwoHandedWeaponInBothSlots ? 'TWO-HANDED WEAPON' : 'TWO-PART TORSO'}: Added to inventory only once`);
  }

  const newEquipment = {
    ...(hero.equipment || {}),
    [slot]: null,
  };

  // Якщо це торс з 2 частин, також знімаємо його з іншого слота
  if (isTwoPartTorso && otherSlot) {
    newEquipment[otherSlot] = null;
    console.log(`[unequipItemLogic] ✅ TWO-PART TORSO: Removed from both slots:`, {
      slot,
      otherSlot,
      itemId,
    });
  }

  // Якщо це дворучна зброя, також знімаємо її з іншого слота
  if (isTwoHandedWeaponInBothSlots && twoHandedOtherSlot) {
    newEquipment[twoHandedOtherSlot] = null;
    console.log(`[unequipItemLogic] ✅ TWO-HANDED WEAPON: Removed from both slots:`, {
      slot,
      twoHandedOtherSlot,
      itemId,
    });
  }

  // Видаляємо рівень заточки для цього слота
  const newEquipmentEnchantLevels = { ...(hero.equipmentEnchantLevels || {}) };
  delete newEquipmentEnchantLevels[slot];
  
  // Якщо це торс з 2 частин, також видаляємо рівень заточки з іншого слота
  if (isTwoPartTorso && otherSlot) {
    delete newEquipmentEnchantLevels[otherSlot];
  }
  
  // Якщо це дворучна зброя, також видаляємо рівень заточки з іншого слота
  if (isTwoHandedWeaponInBothSlots && twoHandedOtherSlot) {
    delete newEquipmentEnchantLevels[twoHandedOtherSlot];
  }

  return {
    ...hero,
    equipment: newEquipment,
    inventory: newInventory,
    equipmentEnchantLevels: newEquipmentEnchantLevels,
  };
}
