import type { Hero, HeroInventoryItem } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { autoDetectArmorType, autoDetectGrade } from "../../utils/items/autoDetectArmorType";
import { findSetForItem } from "../../data/sets/armorSets";
import { isTwoHandedWeapon, getRequiredLevelForGrade } from "./weaponUtils";
import { normalizeSlot, autoSelectEarringOrRingSlot } from "./slotUtils";

// Re-export для зворотної сумісності
export { isTwoHandedWeapon, getRequiredLevelForGrade } from "./weaponUtils";

/**
 * Перевірка рівня для одягання екіпіровки за грейдом
 */
function validateItemGrade(hero: Hero, item: HeroInventoryItem, itemDef: any): boolean {
  const itemGrade = itemDef.grade || item.grade || autoDetectGrade(item.id);
  
  console.log(`[equipItemLogic] 🔍 GRADE CHECK:`, {
    itemId: item.id,
    itemName: item.name,
    itemDefGrade: itemDef.grade,
    itemGrade: item.grade,
    autoDetectedGrade: autoDetectGrade(item.id),
    finalGrade: itemGrade,
    heroLevel: hero.level,
  });
  
  if (itemGrade) {
    const requiredLevel = getRequiredLevelForGrade(itemGrade);
    
    console.log(`[equipItemLogic] 🔍 LEVEL CHECK:`, {
      itemGrade,
      requiredLevel,
      heroLevel: hero.level,
      canEquip: hero.level >= requiredLevel,
    });
    
    if (hero.level < requiredLevel) {
      const gradeNames: Record<string, string> = {
        "NG": "NG",
        "D": "D",
        "C": "C",
        "B": "B",
        "A": "A",
        "S": "S"
      };
      const gradeName = gradeNames[itemGrade] || itemGrade;
      alert(`Недостатньо рівня для одягання ${gradeName}-grade екіпіровки!\n\nПотрібно: ${requiredLevel} рівень\nВаш рівень: ${hero.level}\n\nОбмеження:\n- D-grade: з 20 лвл\n- C-grade: з 40 лвл\n- B-grade: з 52 лвл\n- A-grade: з 62 лвл\n- S-grade: з 76 лвл`);
      return false;
    }
  }
  
  return true;
}

/**
 * Перевірка чи торс має 2 частини (robe або комплектний торс)
 */
function checkSetTorso(
  slot: string,
  item: HeroInventoryItem
): { shouldEquipLegs: boolean; legsItem: HeroInventoryItem | null; isRobe: boolean } {
  let shouldEquipLegs = false;
  let legsItem: HeroInventoryItem | null = null;
  let isRobe = false;
  
  if (slot === "armor") {
    const itemDefForRobe = itemsDBWithStarter[item.id] || itemsDB[item.id];
    const isRobeType = itemDefForRobe?.armorType === "robe" || itemDefForRobe?.kind === "robe";
    isRobe = (item.id?.toLowerCase().includes("robe") || item.name?.toLowerCase().includes("robe") || item.name?.toLowerCase().includes("мантія")) && isRobeType;
    
    console.log(`[equipItemLogic] 🔍 ARMOR EQUIP CHECK:`, {
      itemId: item.id,
      itemName: item.name,
      itemSlot: item.slot,
      isRobe: isRobe,
      armorType: itemDefForRobe?.armorType,
      kind: itemDefForRobe?.kind,
    });
    
    if (isRobe) {
      shouldEquipLegs = true;
      legsItem = item;
      console.log(`[equipItemLogic] ✅ ROBE WITH 2 PARTS: Robe will occupy both armor and legs slots:`, {
        robeId: item.id,
        robeName: item.name,
      });
    } else {
      const set = findSetForItem(item.id);
      console.log(`[equipItemLogic] 🔍 SET CHECK FOR TORSO:`, {
        itemId: item.id,
        itemName: item.name,
        setFound: !!set,
        setName: set?.name,
      });
      if (set) {
        const legsPiece = set.pieces.find(p => p.slot === "legs");
        console.log(`[equipItemLogic] 🔍 LEGS PIECE IN SET:`, {
          legsPiece: legsPiece,
          setPieces: set.pieces,
        });
        if (legsPiece || !legsPiece) {
          shouldEquipLegs = true;
          legsItem = item;
          console.log(`[equipItemLogic] ✅ SET TORSO WITH 2 PARTS: Set torso will occupy both armor and legs slots:`, {
            torsoId: item.id,
            torsoName: item.name,
            set: set.name,
            hasLegsPiece: !!legsPiece,
            legsItemId: legsItem.id,
            legsItemName: legsItem.name,
            sameItem: legsItem.id === item.id,
          });
        }
      }
    }
  }
  
  return { shouldEquipLegs, legsItem, isRobe };
}

/**
 * Видалення предмета з інвентаря
 */
function removeItemFromInventory(
  inventory: HeroInventoryItem[],
  item: HeroInventoryItem,
  isTwoHandedInBothSlots: boolean
): HeroInventoryItem[] {
  const newInventory = [...inventory];
  const itemIndex = newInventory.findIndex((i: any) => i && i.id === item.id);
  
  console.log(`[equipItemLogic] 🔍 REMOVING ITEM FROM INVENTORY:`, {
    itemId: item.id,
    itemName: item.name,
    itemSlot: item.slot,
    itemIndex,
    inventoryLength: newInventory.length,
    isTwoHandedInBothSlots,
    inventoryItemIds: newInventory.filter(Boolean).map((i: any) => ({ id: i.id, name: i.name })).slice(0, 10),
  });
  
  if (itemIndex !== -1) {
    const existingItem = newInventory[itemIndex];
    if (existingItem.count && existingItem.count > 1) {
      existingItem.count = existingItem.count - 1;
      console.log(`[equipItemLogic] Decreased count to ${existingItem.count}`);
    } else {
      newInventory.splice(itemIndex, 1);
      console.log(`[equipItemLogic] Removed item from inventory, new length: ${newInventory.length}`);
    }
  } else {
    console.warn(`[equipItemLogic] ⚠️ ITEM NOT FOUND IN INVENTORY!`, {
      itemId: item.id,
      inventoryItemIds: newInventory.map((i: any) => i.id),
    });
  }
  
  return newInventory;
}

/**
 * Додавання старого предмета в інвентар
 */
function addOldItemToInventory(
  inventory: HeroInventoryItem[],
  oldItemId: string,
  slot: string,
  hero: Hero,
  isTwoHandedInBothSlots: boolean
): HeroInventoryItem[] {
  if (isTwoHandedInBothSlots) {
    return inventory;
  }
  
  const oldItem = itemsDBWithStarter[oldItemId] || itemsDB[oldItemId];
  if (!oldItem) {
    return inventory;
  }
  
  const oldEnchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 0;
  const grade = oldItem.grade || autoDetectGrade(oldItemId);
  const armorType = oldItem.armorType || (oldItem.kind === "armor" || oldItem.kind === "helmet" || oldItem.kind === "boots" || oldItem.kind === "gloves" ? autoDetectArmorType(oldItemId) : undefined);
  
  return [
    ...inventory,
    {
      id: oldItem.id,
      name: oldItem.name,
      slot: oldItem.slot,
      kind: oldItem.kind,
      icon: oldItem.icon,
      description: oldItem.description,
      stats: oldItem.stats,
      count: 1,
      enchantLevel: oldEnchantLevel,
      grade: grade,
      armorType: armorType,
    },
  ];
}

/**
 * Обробка дворучної зброї при одяганні
 */
function handleTwoHandedWeapon(
  slot: string,
  item: HeroInventoryItem,
  hero: Hero,
  newEquipment: Record<string, string | null>,
  newEquipmentEnchantLevels: Record<string, number>,
  newInventory: HeroInventoryItem[]
): { newEquipment: Record<string, string | null>; newEquipmentEnchantLevels: Record<string, number>; newInventory: HeroInventoryItem[] } {
  const isRod = item.id?.toLowerCase().includes("rod") || item.name?.toLowerCase().includes("удочк") || item.name?.toLowerCase().includes("rod");
  const isBow = item.id?.toLowerCase().includes("bow") || item.name?.toLowerCase().includes("лук") || item.name?.toLowerCase().includes("bow");
  
  if (slot === "weapon" && isTwoHandedWeapon(item.id)) {
    if (isRod || isBow) {
      const shieldId = hero.equipment?.shield;
      if (shieldId && shieldId !== item.id) {
        const weaponId = hero.equipment?.weapon;
        const isShieldTwoHanded = isTwoHandedWeapon(shieldId);
        const isWeaponInBoth = weaponId === shieldId && isShieldTwoHanded;
        
        if (!isWeaponInBoth) {
          const shieldItem = itemsDBWithStarter[shieldId] || itemsDB[shieldId];
          if (shieldItem) {
            const grade = shieldItem.grade || autoDetectGrade(shieldId);
            newInventory.push({
              id: shieldItem.id,
              name: shieldItem.name,
              slot: shieldItem.slot,
              kind: shieldItem.kind,
              icon: shieldItem.icon,
              description: shieldItem.description,
              stats: shieldItem.stats,
              count: 1,
              grade: grade,
            });
          }
        }
      }
      newEquipment.shield = item.id;
      if (item.enchantLevel !== undefined) {
        newEquipmentEnchantLevels.shield = item.enchantLevel;
      } else {
        newEquipmentEnchantLevels.shield = 0;
      }
    } else {
      const shieldId = hero.equipment?.shield;
      if (shieldId && shieldId !== item.id) {
        const weaponId = hero.equipment?.weapon;
        const isShieldTwoHanded = isTwoHandedWeapon(shieldId);
        const isWeaponInBoth = weaponId === shieldId && isShieldTwoHanded;
        
        if (!isWeaponInBoth) {
          const shieldItem = itemsDBWithStarter[shieldId] || itemsDB[shieldId];
          if (shieldItem) {
            const grade = shieldItem.grade || autoDetectGrade(shieldId);
            newInventory.push({
              id: shieldItem.id,
              name: shieldItem.name,
              slot: shieldItem.slot,
              kind: shieldItem.kind,
              icon: shieldItem.icon,
              description: shieldItem.description,
              stats: shieldItem.stats,
              count: 1,
              grade: grade,
            });
          }
        }
      }
      newEquipment.shield = item.id;
      if (item.enchantLevel !== undefined) {
        newEquipmentEnchantLevels.shield = item.enchantLevel;
      } else {
        newEquipmentEnchantLevels.shield = 0;
      }
    }
    
    // Знімаємо пуху (dual swords)
    const dualSwordsId = hero.equipment?.lrhand;
    if (dualSwordsId) {
      const dualSwordsItem = itemsDBWithStarter[dualSwordsId] || itemsDB[dualSwordsId];
      if (dualSwordsItem) {
        const grade = dualSwordsItem.grade || autoDetectGrade(dualSwordsId);
        const armorType = dualSwordsItem.armorType || (dualSwordsItem.kind === "armor" || dualSwordsItem.kind === "helmet" || dualSwordsItem.kind === "boots" || dualSwordsItem.kind === "gloves" ? autoDetectArmorType(dualSwordsId) : undefined);
        const oldEnchantLevel = hero.equipmentEnchantLevels?.lrhand ?? 0;
        newInventory.push({
          id: dualSwordsItem.id,
          name: dualSwordsItem.name,
          slot: dualSwordsItem.slot,
          kind: dualSwordsItem.kind,
          icon: dualSwordsItem.icon,
          description: dualSwordsItem.description,
          stats: dualSwordsItem.stats,
          count: 1,
          enchantLevel: oldEnchantLevel,
          grade: grade,
          armorType: armorType,
        });
      }
      newEquipment.lrhand = null;
      if (newEquipmentEnchantLevels.lrhand !== undefined) {
        delete newEquipmentEnchantLevels.lrhand;
      }
    }
  }
  
  return { newEquipment, newEquipmentEnchantLevels, newInventory };
}

/**
 * Основна функція одягання предмета
 */
export function equipItemLogic(hero: Hero, item: HeroInventoryItem): Hero {
  let slot = item.slot;
  if (!slot) return hero;

  // Нормалізація слота
  slot = normalizeSlot(slot, item);

  // Запрещённые категории
  if (["all", "consumable", "resource", "quest", "book", "recipe"].includes(slot)) {
    return hero;
  }

  // Перевірка рівня для одягання екіпіровки за грейдом
  const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
  if (itemDef) {
    if (!validateItemGrade(hero, item, itemDef)) {
      return hero;
    }
  } else {
    console.warn(`[equipItemLogic] ⚠️ ITEM NOT FOUND IN itemsDB:`, {
      itemId: item.id,
      itemName: item.name,
    });
  }

  // Тату можна одягати в слот "tattoo"
  if (slot === "tattoo" && item.kind !== "tattoo") {
    return hero;
  }

  // Автоматичне визначення слота для earring та ring
  slot = autoSelectEarringOrRingSlot(slot, hero);

  // Перевірка чи торс має 2 частини
  const { shouldEquipLegs, legsItem, isRobe } = checkSetTorso(slot, item);

  // Діагностика для лука
  const isBow = item.id?.toLowerCase().includes("bow") || item.name?.toLowerCase().includes("лук") || item.name?.toLowerCase().includes("bow");
  if (isBow) {
    console.log(`[equipItemLogic] 🔍 BOW EQUIP DEBUG:`, {
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon,
      itemSlot: item.slot,
      itemFromInventory: item,
    });
  }

  const currentEquipped = hero.equipment?.[slot] || null;
  let newInventory = [...(hero.inventory || [])];
  
  // Перевіряємо, чи це дворучна зброя в обох слотах
  let isTwoHandedInBothSlots = false;
  if (currentEquipped && (slot === "weapon" || slot === "shield")) {
    const isOldItemTwoHanded = isTwoHandedWeapon(currentEquipped);
    if (isOldItemTwoHanded) {
      const weaponId = hero.equipment?.weapon;
      const shieldId = hero.equipment?.shield;
      if (weaponId === shieldId && weaponId === currentEquipped) {
        isTwoHandedInBothSlots = true;
        console.log(`[equipItemLogic] 🔍 TWO-HANDED WEAPON IN BOTH SLOTS DETECTED, will add only once:`, {
          slot,
          currentEquipped,
          weaponId,
          shieldId,
        });
      }
    }
  }
  
  // Видаляємо предмет з інвентаря
  newInventory = removeItemFromInventory(newInventory, item, isTwoHandedInBothSlots);

  // Перевіряємо, чи це комплектний торс
  let isSetTorsoBeingRemoved = false;
  if (currentEquipped && (slot === "armor" || slot === "legs")) {
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    if (armorItemId === legsItemId && armorItemId === currentEquipped) {
      isSetTorsoBeingRemoved = true;
      console.log(`[equipItemLogic] 🔍 SET TORSO DETECTED IN currentEquipped, will handle separately:`, {
        slot,
        currentEquipped,
        armorItemId,
        legsItemId,
      });
    }
  }
  
  // Додаємо старий предмет в інвентар
  if (currentEquipped && !isSetTorsoBeingRemoved) {
    newInventory = addOldItemToInventory(newInventory, currentEquipped, slot, hero, isTwoHandedInBothSlots);
  }

  // Перевіряємо, чи це щит, і нормалізуємо слот
  const itemDefForSlot = itemsDBWithStarter[item.id] || itemsDB[item.id];
  if (itemDefForSlot && (itemDefForSlot.kind === "shield" || itemDefForSlot.slot === "lhand") && slot !== "shield") {
    slot = "shield";
  }
  
  // Перевіряємо дворучну зброю перед зміною equipment
  let twoHandedInShieldToRemove = false;
  let twoHandedInWeaponToRemove = false;
  
  if (slot === "weapon") {
    const shieldId = hero.equipment?.shield;
    const weaponId = hero.equipment?.weapon;
    if (shieldId && weaponId === shieldId && isTwoHandedWeapon(shieldId)) {
      twoHandedInShieldToRemove = true;
      console.log(`[equipItemLogic] 🔍 TWO-HANDED WEAPON IN SHIELD (when equipping weapon): Will remove from shield slot`);
    }
  }
  
  if (slot === "shield") {
    const weaponId = hero.equipment?.weapon;
    const shieldId = hero.equipment?.shield;
    if (weaponId && shieldId === weaponId && isTwoHandedWeapon(weaponId)) {
      twoHandedInWeaponToRemove = true;
      console.log(`[equipItemLogic] 🔍 TWO-HANDED WEAPON IN WEAPON (when equipping shield): Will remove from weapon slot`);
    }
  }

  let newEquipment: Record<string, string | null> = {
    ...(hero.equipment || {}),
    [slot]: item.id,
  };

  let newEquipmentEnchantLevels: Record<string, number> = {
    ...(hero.equipmentEnchantLevels || {}),
  };
  if (item.enchantLevel !== undefined) {
    newEquipmentEnchantLevels[slot] = item.enchantLevel;
  } else {
    newEquipmentEnchantLevels[slot] = 0;
  }

  // Обробка комплектного торсу
  if (shouldEquipLegs && legsItem) {
    const isRobeItem = legsItem.id === item.id;
    const currentLegsEquipped = hero.equipment?.legs || null;
    const expectedLegsId = isRobeItem ? item.id : legsItem.id;
    
    if (currentLegsEquipped && currentLegsEquipped !== expectedLegsId) {
      const oldLegsItem = itemsDBWithStarter[currentLegsEquipped] || itemsDB[currentLegsEquipped];
      if (oldLegsItem) {
        const oldLegsEnchantLevel = hero.equipmentEnchantLevels?.legs ?? 0;
        const grade = oldLegsItem.grade || autoDetectGrade(currentLegsEquipped);
        const armorType = oldLegsItem.armorType || (oldLegsItem.kind === "armor" || oldLegsItem.kind === "helmet" || oldLegsItem.kind === "boots" || oldLegsItem.kind === "gloves" ? autoDetectArmorType(currentLegsEquipped) : undefined);
        newInventory.push({
          id: oldLegsItem.id,
          name: oldLegsItem.name,
          slot: oldLegsItem.slot,
          kind: oldLegsItem.kind,
          icon: oldLegsItem.icon,
          description: oldLegsItem.description,
          stats: oldLegsItem.stats,
          count: 1,
          enchantLevel: oldLegsEnchantLevel,
          grade: grade,
          armorType: armorType,
        });
      }
    }
    
    newEquipment.legs = legsItem.id;
    
    if (!isRobeItem) {
      const legsItemIndex = newInventory.findIndex((i: any) => i.id === legsItem!.id);
      if (legsItemIndex !== -1) {
        const existingLegsItem = newInventory[legsItemIndex];
        if (existingLegsItem.count && existingLegsItem.count > 1) {
          existingLegsItem.count = existingLegsItem.count - 1;
        } else {
          newInventory.splice(legsItemIndex, 1);
        }
      }
    }
    
    if (legsItem.enchantLevel !== undefined) {
      newEquipmentEnchantLevels.legs = legsItem.enchantLevel;
    } else {
      newEquipmentEnchantLevels.legs = 0;
    }
  }

  // Обробка комплектного торсу при одяганні окремих частин
  if (slot === "legs" && !shouldEquipLegs) {
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    if (armorItemId === legsItemId && armorItemId && armorItemId !== item.id) {
      const setTorsoItem = itemsDBWithStarter[armorItemId] || itemsDB[armorItemId];
      if (setTorsoItem) {
        const setTorsoEnchantLevel = hero.equipmentEnchantLevels?.armor ?? 0;
        const grade = setTorsoItem.grade || autoDetectGrade(armorItemId);
        const armorType = setTorsoItem.armorType || (setTorsoItem.kind === "armor" ? autoDetectArmorType(armorItemId) : undefined);
        const existingSetTorsoIndex = newInventory.findIndex((i: any) => i && i.id === armorItemId);
        if (existingSetTorsoIndex >= 0) {
          const existingItem = newInventory[existingSetTorsoIndex];
          newInventory[existingSetTorsoIndex] = {
            ...existingItem,
            count: (existingItem.count || 1) + 1,
            enchantLevel: setTorsoEnchantLevel,
            grade: grade,
            armorType: armorType,
          };
        } else {
          newInventory.push({
            id: setTorsoItem.id,
            name: setTorsoItem.name,
            slot: setTorsoItem.slot,
            kind: setTorsoItem.kind,
            icon: setTorsoItem.icon,
            description: setTorsoItem.description,
            stats: setTorsoItem.stats,
            count: 1,
            enchantLevel: setTorsoEnchantLevel,
            grade: grade,
            armorType: armorType,
          });
        }
        newEquipment.armor = null;
        delete newEquipmentEnchantLevels.armor;
        console.log(`[equipItemLogic] ✅ REMOVED SET TORSO FROM ARMOR: Set torso removed from armor slot when equipping legs:`, {
          setTorsoId: armorItemId,
          setTorsoName: setTorsoItem.name,
        });
      }
    }
  } else if (slot === "armor" && !shouldEquipLegs) {
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    if (armorItemId === legsItemId && legsItemId && legsItemId !== item.id) {
      const setTorsoItem = itemsDBWithStarter[legsItemId] || itemsDB[legsItemId];
      if (setTorsoItem) {
        const setTorsoEnchantLevel = hero.equipmentEnchantLevels?.legs ?? 0;
        const grade = setTorsoItem.grade || autoDetectGrade(legsItemId);
        const armorType = setTorsoItem.armorType || (setTorsoItem.kind === "armor" ? autoDetectArmorType(legsItemId) : undefined);
        const existingSetTorsoIndex = newInventory.findIndex((i: any) => i && i.id === legsItemId);
        if (existingSetTorsoIndex >= 0) {
          const existingItem = newInventory[existingSetTorsoIndex];
          newInventory[existingSetTorsoIndex] = {
            ...existingItem,
            count: (existingItem.count || 1) + 1,
            enchantLevel: setTorsoEnchantLevel,
            grade: grade,
            armorType: armorType,
          };
        } else {
          newInventory.push({
            id: setTorsoItem.id,
            name: setTorsoItem.name,
            slot: setTorsoItem.slot,
            kind: setTorsoItem.kind,
            icon: setTorsoItem.icon,
            description: setTorsoItem.description,
            stats: setTorsoItem.stats,
            count: 1,
            enchantLevel: setTorsoEnchantLevel,
            grade: grade,
            armorType: armorType,
          });
        }
        newEquipment.legs = null;
        delete newEquipmentEnchantLevels.legs;
        console.log(`[equipItemLogic] ✅ REMOVED SET TORSO FROM LEGS: Set torso removed from legs slot when equipping regular torso:`, {
          setTorsoId: legsItemId,
          setTorsoName: setTorsoItem.name,
        });
      }
    }
  }
  
  if (isBow) {
    console.log(`[equipItemLogic] 🔍 FINAL STATE:`, {
      newEquipment: newEquipment,
      newInventoryCount: newInventory.length,
      newInventoryItems: newInventory.map((i: any) => ({ id: i.id, name: i.name, icon: i.icon })),
    });
  }

  // Обробка дворучної зброї
  const twoHandedResult = handleTwoHandedWeapon(slot, item, hero, newEquipment, newEquipmentEnchantLevels, newInventory);
  newEquipment = twoHandedResult.newEquipment;
  newEquipmentEnchantLevels = twoHandedResult.newEquipmentEnchantLevels;
  newInventory = twoHandedResult.newInventory;

  // Обробка зняття дворучної зброї при одяганні щита
  if (slot === "shield" && twoHandedInWeaponToRemove) {
    const weaponId = hero.equipment?.weapon;
    if (weaponId) {
      const twoHandedItem = itemsDBWithStarter[weaponId] || itemsDB[weaponId];
      if (twoHandedItem) {
        const grade = twoHandedItem.grade || autoDetectGrade(weaponId);
        const oldEnchantLevel = hero.equipmentEnchantLevels?.weapon ?? hero.equipmentEnchantLevels?.shield ?? 0;
        const alreadyInInventory = newInventory.some(invItem => invItem.id === weaponId);
        
        if (!alreadyInInventory) {
          newInventory.push({
            id: twoHandedItem.id,
            name: twoHandedItem.name,
            slot: twoHandedItem.slot,
            kind: twoHandedItem.kind,
            icon: twoHandedItem.icon,
            description: twoHandedItem.description,
            stats: twoHandedItem.stats,
            count: 1,
            enchantLevel: oldEnchantLevel,
            grade: grade,
          });
        }
      }
      newEquipment.weapon = null;
      if (newEquipmentEnchantLevels.weapon !== undefined) {
        delete newEquipmentEnchantLevels.weapon;
      }
    }
  } else if (slot === "shield") {
    const weaponId = hero.equipment?.weapon;
    if (weaponId && isTwoHandedWeapon(weaponId)) {
      const shieldId = hero.equipment?.shield;
      const isWeaponInBoth = weaponId === shieldId && isTwoHandedWeapon(shieldId);
      
      if (!isWeaponInBoth) {
        const weaponItem = itemsDBWithStarter[weaponId] || itemsDB[weaponId];
        if (weaponItem) {
          const grade = weaponItem.grade || autoDetectGrade(weaponId);
          newInventory.push({
            id: weaponItem.id,
            name: weaponItem.name,
            slot: weaponItem.slot,
            kind: weaponItem.kind,
            icon: weaponItem.icon,
            description: weaponItem.description,
            stats: weaponItem.stats,
            count: 1,
            grade: grade,
          });
        }
        newEquipment.weapon = null;
      }
    }
  }
  
  // Обробка зняття дворучної зброї при одяганні зброї
  if (slot === "weapon" && twoHandedInShieldToRemove) {
    const shieldId = hero.equipment?.shield;
    if (shieldId) {
      const twoHandedItem = itemsDBWithStarter[shieldId] || itemsDB[shieldId];
      if (twoHandedItem) {
        const grade = twoHandedItem.grade || autoDetectGrade(shieldId);
        const oldEnchantLevel = hero.equipmentEnchantLevels?.weapon ?? hero.equipmentEnchantLevels?.shield ?? 0;
        const alreadyInInventory = newInventory.some(invItem => invItem.id === shieldId);
        
        if (!alreadyInInventory) {
          newInventory.push({
            id: twoHandedItem.id,
            name: twoHandedItem.name,
            slot: twoHandedItem.slot,
            kind: twoHandedItem.kind,
            icon: twoHandedItem.icon,
            description: twoHandedItem.description,
            stats: twoHandedItem.stats,
            count: 1,
            enchantLevel: oldEnchantLevel,
            grade: grade,
          });
        }
      }
      newEquipment.shield = null;
      if (newEquipmentEnchantLevels.shield !== undefined) {
        delete newEquipmentEnchantLevels.shield;
      }
    }
  }

  return {
    ...hero,
    inventory: newInventory,
    equipment: newEquipment,
    equipmentEnchantLevels: newEquipmentEnchantLevels,
  };
}
