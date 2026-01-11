import type { Hero, HeroInventoryItem } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { autoDetectArmorType, autoDetectGrade } from "../../utils/items/autoDetectArmorType";
import { findSetForItem } from "../../data/sets/armorSets";

// Перевірка, чи є оружие дворучним
function isTwoHandedWeapon(itemId: string | undefined): boolean {
  if (!itemId) return false;
  const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
  if (!def || def.kind !== "weapon") return false;
  
  const name = def.name?.toLowerCase() || "";
  const id = itemId.toLowerCase();
  
  // Дворучне оружие: списа, посохи, луки, глефи, сокири, дворучні мечі, дворучні дубинки, Зарич, удочки
  return (
    id === "zariche" ||
    // Списа та алебарди
    name.includes("spear") ||
    name.includes("спис") ||
    name.includes("lance") ||
    name.includes("halberd") ||
    name.includes("алебарда") ||
    name.includes("glaive") ||
    name.includes("глефа") ||
    name.includes("poleaxe") ||
    name.includes("pole") ||
    id.includes("spear") ||
    id.includes("lance") ||
    id.includes("halberd") ||
    id.includes("glaive") ||
    id.includes("poleaxe") ||
    id.includes("pole") ||
    // Посохи
    name.includes("staff") ||
    name.includes("посох") ||
    id.includes("staff") ||
    // Луки
    name.includes("bow") ||
    name.includes("лук") ||
    id.includes("bow") ||
    // Удочки
    name.includes("rod") ||
    name.includes("удочк") ||
    id.includes("rod") ||
    id.includes("_rod") ||
    // Дворучні мечі
    name.includes("two-handed") ||
    name.includes("дворучний") ||
    name.includes("two_handed") ||
    (name.includes("great") && (name.includes("sword") || name.includes("меч"))) ||
    (name.includes("big") && (name.includes("sword") || name.includes("меч"))) ||
    (name.includes("heaven") && name.includes("divider")) ||
    (name.includes("angel") && name.includes("slayer")) ||
    (name.includes("sword") && name.includes("ipos")) ||
    (name.includes("spiritual") && name.includes("eye")) ||
    (name.includes("spell") && name.includes("breaker")) ||
    (name.includes("berserker") && name.includes("blade")) ||
    (name.includes("paagrian") && name.includes("sword")) ||
    (name.includes("baguette") && name.includes("sword")) ||
    id.includes("two_handed") ||
    id.includes("great_sword") ||
    id.includes("greatsword") ||
    id.includes("big_sword") ||
    id.includes("bigsword") ||
    // Дворучні дубинки
    (name.includes("great") && (name.includes("club") || name.includes("hammer") || name.includes("mace") || name.includes("axe"))) ||
    (name.includes("big") && (name.includes("club") || name.includes("hammer") || name.includes("mace"))) ||
    (name.includes("heavy") && (name.includes("doom") || name.includes("hammer") || name.includes("axe"))) ||
    (name.includes("war") && (name.includes("hammer") || name.includes("axe"))) ||
    (name.includes("dwarven") && (name.includes("hammer") || name.includes("mace"))) ||
    (name.includes("star") && name.includes("buster")) ||
    (name.includes("basalt") && (name.includes("battlehammer") || name.includes("hammer"))) ||
    (name.includes("ice") && name.includes("storm") && name.includes("hammer")) ||
    (name.includes("art") && name.includes("of") && name.includes("battle") && name.includes("axe")) ||
    (name.includes("dragon") && name.includes("hunter") && name.includes("axe")) ||
    (name.includes("titan") && name.includes("hammer")) ||
    (name.includes("demon") && name.includes("splinter")) ||
    id.includes("great_club") ||
    id.includes("greatclub") ||
    id.includes("big_club") ||
    id.includes("bigclub") ||
    id.includes("heavy_doom") ||
    id.includes("heavydoom") ||
    id.includes("war_hammer") ||
    id.includes("warhammer") ||
    id.includes("dwarven_hammer") ||
    id.includes("dwarvenhammer") ||
    id.includes("star_buster") ||
    id.includes("starbuster") ||
    id.includes("titan_hammer") ||
    id.includes("titanhammer") ||
    id.includes("big_hammer") ||
    id.includes("bighammer") ||
    id.includes("ice_storm") ||
    id.includes("icestorm")
  );
}

// Обмеження рівня для одягання екіпіровки за грейдами
function getRequiredLevelForGrade(grade: string | undefined): number {
  if (!grade) return 0; // NG-grade - без обмежень
  
  switch (grade) {
    case "NG": return 0;   // NG-grade - з 1 лвл
    case "D": return 20;   // D-grade - з 20 лвл
    case "C": return 40;   // C-grade - з 40 лвл
    case "B": return 52;   // B-grade - з 52 лвл
    case "A": return 62;   // A-grade - з 62 лвл
    case "S": return 76;   // S-grade - з 76 лвл
    default: return 0;
  }
}

export function equipItemLogic(hero: Hero, item: HeroInventoryItem): Hero {
  let slot = item.slot;
  if (!slot) return hero;

  // Конвертуємо XML формат слотів в стандартний формат
  // rear;lear -> earring, rfinger;lfinger -> ring
  // lhand -> shield (для щитів)
  // lrhand -> weapon (для зброї, включаючи удочки)
  if (slot.includes("rear") || slot.includes("lear") || slot === "rear;lear") {
    slot = "earring";
  } else if (slot.includes("rfinger") || slot.includes("lfinger") || slot === "rfinger;lfinger") {
    slot = "ring";
  } else if (slot === "lhand") {
    // Перевіряємо, чи це щит
    const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
    if (itemDef && (itemDef.kind === "shield" || itemDef.kind === "armor")) {
      slot = "shield";
    }
  } else if (slot === "lrhand") {
    // Перевіряємо, чи це зброя (включаючи удочки)
    const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
    if (itemDef && itemDef.kind === "weapon") {
      slot = "weapon";
    }
  }

  // Запрещённые категории
  if (["all", "consumable", "resource", "quest", "book", "recipe"].includes(slot)) {
    return hero;
  }

  // Перевірка рівня для одягання екіпіровки за грейдом
  const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
  if (itemDef) {
    // Спочатку беремо grade з itemsDB, потім з item, потім визначаємо автоматично
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
    
    // Якщо грейд не визначено, вважаємо що це NG-grade (без обмежень)
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
        return hero;
      }
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
  // Дозволяємо одягати однакові предмети в різні слоти (наприклад, два однакові кільця)
  if (slot === "earring") {
    // Якщо earring_left вільний, одягаємо туди, інакше в earring_right
    if (!hero.equipment?.earring_left) {
      slot = "earring_left";
    } else if (!hero.equipment?.earring_right) {
      slot = "earring_right";
    } else {
      // Якщо обидва зайняті, замінюємо earring_left
      slot = "earring_left";
    }
  } else if (slot === "ring") {
    // Якщо ring_left вільний, одягаємо туди, інакше в ring_right
    if (!hero.equipment?.ring_left) {
      slot = "ring_left";
    } else if (!hero.equipment?.ring_right) {
      slot = "ring_right";
    } else {
      // Якщо обидва зайняті, замінюємо ring_left
      slot = "ring_left";
    }
  }

  // Перевірка чи торс має 2 частини (торс + штани)
  // Якщо одягаємо торс (armor), перевіряємо чи є відповідні штани в інвентарі з того ж сету
  // Або якщо це robe (мантія), яка займає обидва слоти (armor і legs) одночасно
  let shouldEquipLegs = false;
  let legsItem: HeroInventoryItem | null = null;
  let isRobe = false;
  
  if (slot === "armor") {
    // Перевіряємо, чи це robe (мантія), яка займає обидва слоти
    // Важливо: robe - це тільки magic armor (robe), не heavy або light armor
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
      // Для robe автоматично займаємо обидва слоти (armor і legs)
      // Використовуємо той самий предмет для обох слотів
      shouldEquipLegs = true;
      legsItem = item; // Використовуємо той самий предмет
      console.log(`[equipItemLogic] ✅ ROBE WITH 2 PARTS: Robe will occupy both armor and legs slots:`, {
        robeId: item.id,
        robeName: item.name,
      });
    } else {
      // Шукаємо сет, до якого належить цей торс
      const set = findSetForItem(item.id);
      console.log(`[equipItemLogic] 🔍 SET CHECK FOR TORSO:`, {
        itemId: item.id,
        itemName: item.name,
        setFound: !!set,
        setName: set?.name,
      });
      if (set) {
        // Комплектний торс: якщо торс належить до сету, він займає обидва слоти (chest + legs)
        // Перевіряємо, чи в сеті є окремі штани
        const legsPiece = set.pieces.find(p => p.slot === "legs");
        console.log(`[equipItemLogic] 🔍 LEGS PIECE IN SET:`, {
          legsPiece: legsPiece,
          setPieces: set.pieces,
        });
        // Якщо в сеті є штани (legsPiece), то торс комплектний і замінює обидва предмети
        // АБО якщо в сеті немає окремих штанів, то торс сам по собі комплектний
        if (legsPiece || !legsPiece) {
          // В обох випадках торс одягається на обидва слоти
          shouldEquipLegs = true;
          legsItem = item; // Використовуємо той самий предмет (торс) - ВАЖЛИВО!
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
  // Правильно обробляємо count: якщо count > 1, зменшуємо на 1, інакше видаляємо
  let newInventory = [...(hero.inventory || [])];
  const itemIndex = newInventory.findIndex((i: any) => i && i.id === item.id);
  
  // Перевіряємо, чи це дворучна зброя (удочка, лук, дворучний меч, дворучна дубинка), яка займає обидва слоти (weapon і shield)
  // Якщо так - не додаємо її в інвентар двічі при одяганні щита/оружия
  let isTwoHandedInBothSlots = false;
  if (currentEquipped && (slot === "weapon" || slot === "shield")) {
    const isOldItemTwoHanded = isTwoHandedWeapon(currentEquipped);
    if (isOldItemTwoHanded) {
      const weaponId = hero.equipment?.weapon;
      const shieldId = hero.equipment?.shield;
      // Якщо дворучна зброя в обох слотах, не додаємо її тут - додамо пізніше один раз
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
  
  console.log(`[equipItemLogic] 🔍 REMOVING ITEM FROM INVENTORY:`, {
    itemId: item.id,
    itemName: item.name,
    itemSlot: item.slot,
    normalizedSlot: slot,
    itemIndex,
    inventoryLength: newInventory.length,
    isTwoHandedInBothSlots,
    inventoryItemIds: newInventory.filter(Boolean).map((i: any) => ({ id: i.id, name: i.name })).slice(0, 10),
  });
  
  if (itemIndex !== -1) {
    const existingItem = newInventory[itemIndex];
    if (isBow) {
      console.log(`[equipItemLogic] 🔍 BOW FOUND IN INVENTORY:`, {
        existingItem: existingItem,
        count: existingItem.count,
        willRemove: !(existingItem.count && existingItem.count > 1),
      });
    }
    if (existingItem.count && existingItem.count > 1) {
      // Якщо count > 1, зменшуємо на 1
      existingItem.count = existingItem.count - 1;
      console.log(`[equipItemLogic] Decreased count to ${existingItem.count}`);
    } else {
      // Якщо count === 1 або не визначено, видаляємо предмет
      newInventory.splice(itemIndex, 1);
      console.log(`[equipItemLogic] Removed item from inventory, new length: ${newInventory.length}`);
    }
  } else {
    console.warn(`[equipItemLogic] ⚠️ ITEM NOT FOUND IN INVENTORY!`, {
      itemId: item.id,
      inventoryItemIds: newInventory.map((i: any) => i.id),
    });
  }

  // Если есть предмет, который был в этом слоте
  // Перевіряємо, чи це удочка, яка займає обидва слоти (weapon і shield)
  // Якщо так - не додаємо її в інвентар тут, бо вона буде додана пізніше при обробці удочки
  // Перевіряємо, чи це комплектний торс (який знаходиться в обох слотах armor і legs)
  // Якщо так - не додаємо його тут, бо він буде оброблений пізніше
  let isSetTorsoBeingRemoved = false;
  if (currentEquipped && (slot === "armor" || slot === "legs")) {
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    // Якщо в armor і legs той самий предмет - це комплектний торс
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
  
  if (currentEquipped && !isSetTorsoBeingRemoved) {
    const oldItem = itemsDBWithStarter[currentEquipped] || itemsDB[currentEquipped];
    if (oldItem) {
      if (!isTwoHandedInBothSlots) {
        const oldEnchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 0;
        // Автоматично визначаємо grade та armorType, якщо вони не вказані в itemsDB
        const grade = oldItem.grade || autoDetectGrade(currentEquipped);
        const armorType = oldItem.armorType || (oldItem.kind === "armor" || oldItem.kind === "helmet" || oldItem.kind === "boots" || oldItem.kind === "gloves" ? autoDetectArmorType(currentEquipped) : undefined);
        
        const oldItemIsBow = oldItem.id?.toLowerCase().includes("bow") || oldItem.name?.toLowerCase().includes("лук") || oldItem.name?.toLowerCase().includes("bow");
        if (oldItemIsBow || isBow) {
          console.log(`[equipItemLogic] 🔍 OLD ITEM (BOW?) BEING ADDED TO INVENTORY:`, {
            oldItemId: oldItem.id,
            oldItemName: oldItem.name,
            oldItemIcon: oldItem.icon,
            oldItemFromDB: oldItem,
            willAddToInventory: {
              id: oldItem.id,
              name: oldItem.name,
              icon: oldItem.icon,
              grade: grade,
            },
          });
        }
        
        newInventory.push({
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
        });
      }
    }
  }

  // Перевіряємо, чи це щит, і нормалізуємо слот
  const itemDefForSlot = itemsDBWithStarter[item.id] || itemsDB[item.id];
  if (itemDefForSlot && (itemDefForSlot.kind === "shield" || itemDefForSlot.slot === "lhand") && slot !== "shield") {
    slot = "shield";
  }
  
  // Якщо одягається оружие або щит - перевіряємо чи дворучна зброя в обох слотах і знімаємо її
  // Перевіряємо ПЕРЕД тим, як змінюємо equipment, щоб мати доступ до поточного стану
  let twoHandedInShieldToRemove = false;
  let twoHandedInWeaponToRemove = false;
  
  if (slot === "weapon") {
    // Перевіряємо, чи в shield є та сама дворучна зброя (якщо вона в обох слотах)
    const shieldId = hero.equipment?.shield;
    const weaponId = hero.equipment?.weapon;
    if (shieldId && weaponId === shieldId && isTwoHandedWeapon(shieldId)) {
      twoHandedInShieldToRemove = true;
      console.log(`[equipItemLogic] 🔍 TWO-HANDED WEAPON IN SHIELD (when equipping weapon): Will remove from shield slot`);
    }
  }
  
  if (slot === "shield") {
    // Перевіряємо, чи в weapon є дворучна зброя (якщо вона в обох слотах)
    const weaponId = hero.equipment?.weapon;
    const shieldId = hero.equipment?.shield;
    if (weaponId && shieldId === weaponId && isTwoHandedWeapon(weaponId)) {
      twoHandedInWeaponToRemove = true;
      console.log(`[equipItemLogic] 🔍 TWO-HANDED WEAPON IN WEAPON (when equipping shield): Will remove from weapon slot`);
    }
  }

  const newEquipment: Record<string, string | null> = {
    ...(hero.equipment || {}),
    [slot]: item.id,
  };

  // Копіюємо рівень заточки з інвентаря в equipmentEnchantLevels
  const newEquipmentEnchantLevels: Record<string, number> = {
    ...(hero.equipmentEnchantLevels || {}),
  };
  if (item.enchantLevel !== undefined) {
    newEquipmentEnchantLevels[slot] = item.enchantLevel;
  } else {
    // Якщо рівень заточки не вказано, встановлюємо 0
    newEquipmentEnchantLevels[slot] = 0;
  }

  // Якщо одягаємо торс з 2 частин, одягаємо також штани в слот legs
  if (shouldEquipLegs && legsItem) {
    // Перевіряємо, чи це robe (мантія) або комплектний торс (set torso), який використовує той самий предмет для обох слотів
    const isRobeItem = legsItem.id === item.id;
    const isSetTorso = !isRobe && isRobeItem; // Комплектний торс: не robe, але той самий предмет для обох слотів
    
    console.log(`[equipItemLogic] 🔍 EQUIPPING LEGS:`, {
      shouldEquipLegs,
      legsItemId: legsItem.id,
      legsItemName: legsItem.name,
      itemId: item.id,
      isRobeItem,
    });
    
    // Знімаємо старі штани, якщо вони є
    // Важливо: для robe (isRobeItem) ми використовуємо той самий item.id для обох слотів
    // Для heavy/light armor ми використовуємо різні itemId (breastplate та gaiters)
    const currentLegsEquipped = hero.equipment?.legs || null;
    // Для robe перевіряємо item.id, для інших - legsItem.id
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
    
    // Одягаємо штани в слот legs (комплектний торс)
    newEquipment.legs = legsItem.id;
    
    // Видаляємо штани з інвентаря (тільки якщо це не robe, яка використовує той самий предмет)
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
    
    // Копіюємо рівень заточки для штанів
    if (legsItem.enchantLevel !== undefined) {
      newEquipmentEnchantLevels.legs = legsItem.enchantLevel;
    } else {
      newEquipmentEnchantLevels.legs = 0;
    }
  }

  // Перевіряємо, чи є комплектний торс в іншому слоті (якщо одягаємо штани або простий торс)
  // Якщо одягаємо штани (slot === "legs"), перевіряємо чи в armor є той самий торс (комплектний торс)
  // Якщо одягаємо простий торс (slot === "armor" і не комплектний), перевіряємо чи в legs є той самий торс
  if (slot === "legs" && !shouldEquipLegs) {
    // Одягаємо окремі штани (не комплектний торс)
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    // Якщо в armor і legs той самий предмет - це комплектний торс, потрібно його зняти з armor
    if (armorItemId === legsItemId && armorItemId && armorItemId !== item.id) {
      const setTorsoItem = itemsDBWithStarter[armorItemId] || itemsDB[armorItemId];
      if (setTorsoItem) {
        // Знімаємо комплектний торс зі слоту armor
        const setTorsoEnchantLevel = hero.equipmentEnchantLevels?.armor ?? 0;
        const grade = setTorsoItem.grade || autoDetectGrade(armorItemId);
        const armorType = setTorsoItem.armorType || (setTorsoItem.kind === "armor" ? autoDetectArmorType(armorItemId) : undefined);
        const existingSetTorsoIndex = newInventory.findIndex((i: any) => i && i.id === armorItemId);
        if (existingSetTorsoIndex >= 0) {
          // Якщо вже є в інвентарі, збільшуємо count
          const existingItem = newInventory[existingSetTorsoIndex];
          newInventory[existingSetTorsoIndex] = {
            ...existingItem,
            count: (existingItem.count || 1) + 1,
            enchantLevel: setTorsoEnchantLevel,
            grade: grade,
            armorType: armorType,
          };
        } else {
          // Додаємо в інвентар
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
        // Очищаємо слот armor
        newEquipment.armor = null;
        delete newEquipmentEnchantLevels.armor;
        console.log(`[equipItemLogic] ✅ REMOVED SET TORSO FROM ARMOR: Set torso removed from armor slot when equipping legs:`, {
          setTorsoId: armorItemId,
          setTorsoName: setTorsoItem.name,
        });
      }
    }
  } else if (slot === "armor" && !shouldEquipLegs) {
    // Якщо одягаємо простий торс (не комплектний), перевіряємо чи в legs є той самий торс (комплектний торс)
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    // Якщо в armor і legs той самий предмет - це комплектний торс, потрібно його зняти з legs
    if (armorItemId === legsItemId && legsItemId && legsItemId !== item.id) {
      const setTorsoItem = itemsDBWithStarter[legsItemId] || itemsDB[legsItemId];
      if (setTorsoItem) {
        // Знімаємо комплектний торс зі слоту legs
        const setTorsoEnchantLevel = hero.equipmentEnchantLevels?.legs ?? 0;
        const grade = setTorsoItem.grade || autoDetectGrade(legsItemId);
        const armorType = setTorsoItem.armorType || (setTorsoItem.kind === "armor" ? autoDetectArmorType(legsItemId) : undefined);
        const existingSetTorsoIndex = newInventory.findIndex((i: any) => i && i.id === legsItemId);
        if (existingSetTorsoIndex >= 0) {
          // Якщо вже є в інвентарі, збільшуємо count
          const existingItem = newInventory[existingSetTorsoIndex];
          newInventory[existingSetTorsoIndex] = {
            ...existingItem,
            count: (existingItem.count || 1) + 1,
            enchantLevel: setTorsoEnchantLevel,
            grade: grade,
            armorType: armorType,
          };
        } else {
          // Додаємо в інвентар
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
        // Очищаємо слот legs
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

  // Якщо екіпують дворучне оружие - знімаємо щит та пуху (dual swords)
  // Для удочок, луків, дворучних мечів та дворучних дубинок - займаємо обидва слоти (weapon і shield) одночасно
  const isRod = item.id?.toLowerCase().includes("rod") || item.name?.toLowerCase().includes("удочк") || item.name?.toLowerCase().includes("rod");
  
  if (slot === "weapon" && isTwoHandedWeapon(item.id)) {
    // Перевіряємо, чи це удочка, лук, дворучний меч або дворучна дубинка - вони займають обидва слоти
    if (isRod || isBow) {
      // Для удочок та луків - займаємо обидва слоти (weapon і shield) одночасно
      // Знімаємо щит, якщо він є (тільки якщо це не та сама зброя)
      const shieldId = hero.equipment?.shield;
      if (shieldId && shieldId !== item.id) {
        // Перевіряємо, чи це не та сама зброя в обох слотах
        const weaponId = hero.equipment?.weapon;
        const isShieldTwoHanded = isTwoHandedWeapon(shieldId);
        const isWeaponInBoth = weaponId === shieldId && isShieldTwoHanded;
        
        // Якщо це не та сама зброя в обох слотах - додаємо щит в інвентар
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
      // Одягаємо зброю в обидва слоти
      newEquipment.shield = item.id;
      // Копіюємо рівень заточки для щита
      if (item.enchantLevel !== undefined) {
        newEquipmentEnchantLevels.shield = item.enchantLevel;
      } else {
        newEquipmentEnchantLevels.shield = 0;
      }
    } else {
      // Для дворучних мечів та дворучних дубинок - також займаємо обидва слоти (weapon і shield)
      const shieldId = hero.equipment?.shield;
      if (shieldId && shieldId !== item.id) {
        // Перевіряємо, чи це не та сама зброя в обох слотах
        const weaponId = hero.equipment?.weapon;
        const isShieldTwoHanded = isTwoHandedWeapon(shieldId);
        const isWeaponInBoth = weaponId === shieldId && isShieldTwoHanded;
        
        // Якщо це не та сама зброя в обох слотах - додаємо щит в інвентар
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
      // Одягаємо дворучну зброю в обидва слоти
      newEquipment.shield = item.id;
      // Копіюємо рівень заточки для щита
      if (item.enchantLevel !== undefined) {
        newEquipmentEnchantLevels.shield = item.enchantLevel;
      } else {
        newEquipmentEnchantLevels.shield = 0;
      }
    }
    
    // Знімаємо пуху (dual swords) - займає слот lrhand
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
      // Видаляємо рівень заточки для пухи
      if (newEquipmentEnchantLevels.lrhand !== undefined) {
        delete newEquipmentEnchantLevels.lrhand;
      }
    }
  }

  // Якщо одягається щит і дворучна зброя в weapon - знімаємо зброю з weapon і додаємо в інвентар
  if (slot === "shield" && twoHandedInWeaponToRemove) {
    const weaponId = hero.equipment?.weapon;
    if (weaponId) {
      // Завжди додаємо дворучну зброю в інвентар, якщо вона знімається через twoHandedInWeaponToRemove
      const twoHandedItem = itemsDBWithStarter[weaponId] || itemsDB[weaponId];
      if (twoHandedItem) {
        const grade = twoHandedItem.grade || autoDetectGrade(weaponId);
        const oldEnchantLevel = hero.equipmentEnchantLevels?.weapon ?? hero.equipmentEnchantLevels?.shield ?? 0;
        
        // Перевіряємо, чи зброя вже не в інвентарі
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
          console.log(`[equipItemLogic] ✅ TWO-HANDED WEAPON ADDED TO INVENTORY (when equipping shield, removed from weapon)`, {
            weaponId,
            twoHandedItem: { id: twoHandedItem.id, name: twoHandedItem.name },
            inventoryLength: newInventory.length,
          });
        } else {
          console.log(`[equipItemLogic] ⚠️ TWO-HANDED WEAPON ALREADY IN INVENTORY (when equipping shield, removed from weapon)`, {
            weaponId,
            inventoryLength: newInventory.length,
          });
        }
      } else {
        console.error(`[equipItemLogic] ❌ TWO-HANDED WEAPON ITEM NOT FOUND!`, { weaponId });
      }
      // Знімаємо з weapon
      newEquipment.weapon = null;
      // Видаляємо рівень заточки для weapon
      if (newEquipmentEnchantLevels.weapon !== undefined) {
        delete newEquipmentEnchantLevels.weapon;
      }
      console.log(`[equipItemLogic] ✅ TWO-HANDED WEAPON REMOVED FROM WEAPON (when equipping shield)`);
    }
  } else if (slot === "shield") {
    // Якщо екіпують щит - знімаємо дворучне оружие (якщо це не удочка в обох слотах)
    const weaponId = hero.equipment?.weapon;
    if (weaponId && isTwoHandedWeapon(weaponId)) {
      // Перевіряємо, чи це дворучна зброя в обох слотах
      const shieldId = hero.equipment?.shield;
      const isWeaponInBoth = weaponId === shieldId && isTwoHandedWeapon(shieldId);
      
      // Якщо це не дворучна зброя в обох слотах - знімаємо стандартно
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
  
  // Якщо одягається оружие і дворучна зброя в shield - знімаємо зброю з shield і додаємо в інвентар
  if (slot === "weapon" && twoHandedInShieldToRemove) {
    const shieldId = hero.equipment?.shield;
    if (shieldId) {
      // Завжди додаємо дворучну зброю в інвентар, якщо вона знімається через twoHandedInShieldToRemove
      const twoHandedItem = itemsDBWithStarter[shieldId] || itemsDB[shieldId];
      if (twoHandedItem) {
        const grade = twoHandedItem.grade || autoDetectGrade(shieldId);
        const oldEnchantLevel = hero.equipmentEnchantLevels?.weapon ?? hero.equipmentEnchantLevels?.shield ?? 0;
        
        // Перевіряємо, чи зброя вже не в інвентарі
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
          console.log(`[equipItemLogic] ✅ TWO-HANDED WEAPON ADDED TO INVENTORY (when equipping weapon, removed from shield)`, {
            shieldId,
            twoHandedItem: { id: twoHandedItem.id, name: twoHandedItem.name },
            inventoryLength: newInventory.length,
          });
        } else {
          console.log(`[equipItemLogic] ⚠️ TWO-HANDED WEAPON ALREADY IN INVENTORY (when equipping weapon, removed from shield)`, {
            shieldId,
            inventoryLength: newInventory.length,
          });
        }
      } else {
        console.error(`[equipItemLogic] ❌ TWO-HANDED WEAPON ITEM NOT FOUND!`, { shieldId });
      }
      // Знімаємо з shield
      newEquipment.shield = null;
      // Видаляємо рівень заточки для shield
      if (newEquipmentEnchantLevels.shield !== undefined) {
        delete newEquipmentEnchantLevels.shield;
      }
      console.log(`[equipItemLogic] ✅ TWO-HANDED WEAPON REMOVED FROM SHIELD (when equipping weapon)`);
    }
  }

  return {
    ...hero,
    inventory: newInventory,
    equipment: newEquipment,
    equipmentEnchantLevels: newEquipmentEnchantLevels,
  };
}

export function unequipItemLogic(hero: Hero, slot: string): Hero {
  if (!slot) return hero;

  const itemId = hero.equipment?.[slot];
  if (!itemId) return hero;

  const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
  if (!def) return hero;

  // Перевіряємо, чи це торс з 2 частин (robe), який займає обидва слоти (armor і legs)
  // Якщо користувач клікає на "legs" або "armor", і той самий предмет знаходиться в обох слотах,
  // то знімаємо його з обох слотів і додаємо в інвентар один раз
  let isTwoPartTorso = false;
  let otherSlot: string | null = null;
  
  if (slot === "legs" || slot === "armor") {
    const armorItemId = hero.equipment?.armor;
    const legsItemId = hero.equipment?.legs;
    
    // Якщо той самий предмет знаходиться в обох слотах, це торс з 2 частин
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
  // Якщо користувач клікає на "weapon" або "shield", і той самий предмет знаходиться в обох слотах,
  // то знімаємо його з обох слотів і додаємо в інвентар один раз
  let isTwoHandedWeaponInBothSlots = false;
  let twoHandedOtherSlot: string | null = null;
  
  if (slot === "weapon" || slot === "shield") {
    const weaponItemId = hero.equipment?.weapon;
    const shieldItemId = hero.equipment?.shield;
    
    // Перевіряємо, чи це дворучна зброя
    const isTwoHandedItem = isTwoHandedWeapon(itemId);
    
    // Якщо той самий предмет знаходиться в обох слотах (weapon і shield), це дворучна зброя
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
  
  // Беремо рівень заточки зі слота, на який клікнули (або з armor, якщо це торс з 2 частин, або з weapon/shield, якщо це дворучна зброя)
  const enchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 
    (isTwoPartTorso && otherSlot ? (hero.equipmentEnchantLevels?.[otherSlot] ?? 0) : 0) ??
    (isTwoHandedWeaponInBothSlots && twoHandedOtherSlot ? (hero.equipmentEnchantLevels?.[twoHandedOtherSlot] ?? 0) : 0);
  
  // Автоматично визначаємо grade та armorType, якщо вони не вказані в itemsDB
  const grade = def.grade || autoDetectGrade(itemId);
  const armorType = def.armorType || (def.kind === "armor" || def.kind === "helmet" || def.kind === "boots" || def.kind === "gloves" ? autoDetectArmorType(itemId) : undefined);
  
  // Додаємо предмет в інвентар тільки один раз (навіть якщо це торс з 2 частин або дворучна зброя)
  // Перевіряємо, чи це дворучна зброя або торс з 2 частин, щоб не дублювати
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

