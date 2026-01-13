// src/state/battle/actions/enchantScroll.ts
import type { BattleState } from "../types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../heroStore";

/**
 * Обробка заточки предметів заточками
 * 
 * Правила:
 * - Прості заточки: 50% шанс успіху
 *   - При невдачі на зброї: падає до +0 (безпечна заточка)
 *   - При невдачі на броні: не ламається (безпечна заточка)
 * - Благословенні заточки (bless): 95% шанс успіху
 *   - При невдачі: падає до +3 (безпечна заточка +3)
 * - При успіху: +1 до заточки
 */
export function handleEnchantScroll(
  scrollItemId: string, // ID заточки (наприклад, "d_enchant_weapon_scroll")
  targetItemId: string, // ID предмета для заточки
  targetSlot: string | null, // Слот предмета (якщо екіпірований) або null (якщо в інвентарі)
  state: BattleState,
  hero: Hero,
  setAndPersist: (updates: Partial<BattleState>) => void,
  updateHero: (partial: Partial<Hero>) => void
): boolean {
  const heroStore = useHeroStore.getState();
  const currentHero = heroStore.hero;
  if (!currentHero) {
    setAndPersist({
      log: [`Помилка: герой не знайдено`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Перевіряємо чи є заточка в інвентарі
  const scrollItem = currentHero.inventory.find((i: HeroInventoryItem) => i.id === scrollItemId);
  if (!scrollItem || (scrollItem.count ?? 0) <= 0) {
    setAndPersist({
      log: [`Немає заточки в інвентарі`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Визначаємо тип заточки (зброя чи броня)
  const isWeaponScroll = scrollItemId.includes("weapon");
  const isArmorScroll = scrollItemId.includes("armor");

  if (!isWeaponScroll && !isArmorScroll) {
    setAndPersist({
      log: [`Невідомий тип заточки`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Знаходимо предмет для заточки
  let targetItem: HeroInventoryItem | null = null;
  let currentEnchantLevel = 0;

  if (targetSlot && hero.equipment?.[targetSlot]) {
    // Предмет екіпірований
    const equippedItemId = hero.equipment[targetSlot];
    if (equippedItemId !== targetItemId) {
      setAndPersist({
        log: [`Предмет не знайдено в слоті ${targetSlot}`, ...state.log].slice(0, 30),
      });
      return false;
    }
    currentEnchantLevel = hero.equipmentEnchantLevels?.[targetSlot] ?? 0;
  } else {
    // Предмет в інвентарі
    targetItem = currentHero.inventory.find((i: HeroInventoryItem) => i.id === targetItemId) || null;
    if (!targetItem) {
      setAndPersist({
        log: [`Предмет не знайдено в інвентарі`, ...state.log].slice(0, 30),
      });
      return false;
    }
    currentEnchantLevel = targetItem.enchantLevel ?? 0;
  }

  // Перевіряємо чи предмет відповідає типу заточки
  const itemDef = itemsDB[targetItemId];
  if (!itemDef) {
    setAndPersist({
      log: [`Предмет не знайдено в базі даних`, ...state.log].slice(0, 30),
    });
    return false;
  }

  const isWeapon = itemDef.kind === "weapon";
  // Заточки для броні працюють з: бронею, шоломом, рукавицями, чоботами, щитом, біжутерією, поясом, плащем
  const isArmor = ["armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.kind || "") ||
                  ["necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.slot || "");

  if (isWeaponScroll && !isWeapon) {
    setAndPersist({
      log: [`Ця заточка тільки для зброї!`, ...state.log].slice(0, 30),
    });
    return false;
  }

  if (isArmorScroll && !isArmor) {
    setAndPersist({
      log: [`Ця заточка тільки для броні!`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Перевіряємо грейд заточки та предмета
  const scrollGrade = getGradeFromScrollId(scrollItemId);
  const itemGrade = getGradeFromItemId(targetItemId);

  if (scrollGrade && itemGrade && scrollGrade !== itemGrade) {
    setAndPersist({
      log: [`Грейд заточки (${scrollGrade}) не відповідає грейду предмета (${itemGrade})!`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Видаляємо заточку з інвентаря
  const updatedInventory = currentHero.inventory.map((i: HeroInventoryItem) => {
    if (i.id === scrollItemId) {
      const newCount = (i.count ?? 1) - 1;
      return newCount > 0 ? { ...i, count: newCount } : null;
    }
    return i;
  }).filter(Boolean) as HeroInventoryItem[];

  // Перевіряємо чи це blessed scroll (заточка з квест-шопу)
  const isBlessedScroll = scrollItemId.includes("bless") || scrollItemId.includes("quest_shop");

  // Визначаємо шанс успіху заточки залежно від типу та поточного рівня
  let successChance: number;
  
  if (isWeapon) {
    // Зброя: максимальна заточка +40
    // До +5: 100%, +5-+15: 80%, +15-+30: 70%, +30-+40: 60%
    if (currentEnchantLevel < 5) {
      successChance = 1.0; // 100%
    } else if (currentEnchantLevel < 15) {
      successChance = 0.8; // 80%
    } else if (currentEnchantLevel < 30) {
      successChance = 0.7; // 70%
    } else if (currentEnchantLevel < 40) {
      successChance = 0.6; // 60%
    } else {
      // Максимальна заточка досягнута
      setAndPersist({
        log: [`⚠️ ${itemDef.name} вже має максимальну заточку +40!`, ...state.log].slice(0, 30),
      });
      return false;
    }
  } else {
    // Броня/біжутерія/пояс/плащ: максимальна заточка +30
    // До +3: 100%, до +10: 90%, до +20: 80%, до +30: 70%
    if (currentEnchantLevel < 3) {
      successChance = 1.0; // 100%
    } else if (currentEnchantLevel < 10) {
      successChance = 0.9; // 90%
    } else if (currentEnchantLevel < 20) {
      successChance = 0.8; // 80%
    } else if (currentEnchantLevel < 30) {
      successChance = 0.7; // 70%
    } else {
      // Максимальна заточка досягнута
      setAndPersist({
        log: [`⚠️ ${itemDef.name} вже має максимальну заточку +30!`, ...state.log].slice(0, 30),
      });
      return false;
    }
  }

  // Для blessed scrolls встановлюємо мінімальний шанс успіху 95%
  if (isBlessedScroll) {
    successChance = Math.max(successChance, 0.95); // Мінімум 95% для blessed scrolls
  }
  
  const success = Math.random() < successChance;

  if (success) {
    // Успіх: +1 до заточки
    const newEnchantLevel = currentEnchantLevel + 1;

    if (targetSlot && hero.equipment?.[targetSlot]) {
      // Оновлюємо рівень заточки екіпірованого предмета
      const updatedEquipmentEnchantLevels = {
        ...(hero.equipmentEnchantLevels || {}),
        [targetSlot]: newEnchantLevel,
      };
      updateHero({
        inventory: updatedInventory,
        equipmentEnchantLevels: updatedEquipmentEnchantLevels,
      });
    } else if (targetItem) {
      // Оновлюємо рівень заточки предмета в інвентарі
      const updatedInventoryWithEnchant = updatedInventory.map((i: HeroInventoryItem) => {
        if (i.id === targetItemId) {
          return { ...i, enchantLevel: newEnchantLevel };
        }
        return i;
      });
      updateHero({ inventory: updatedInventoryWithEnchant });
    }

    setAndPersist({
      log: [`✅ Заточка успішна! ${itemDef.name} тепер +${newEnchantLevel}`, ...state.log].slice(0, 30),
    });
    return true;
  } else {
    // Невдача
    let newEnchantLevelAfterFail: number;
    
    // Для blessed scrolls при невдачі падає до +3 (безпечна заточка +3)
    if (isBlessedScroll) {
      // Якщо поточний рівень вище +3, падає до +3, інакше залишається на поточному
      if (currentEnchantLevel > 3) {
        newEnchantLevelAfterFail = 3;
      } else {
        newEnchantLevelAfterFail = currentEnchantLevel; // Залишається на поточному, якщо вже +3 або нижче
      }
    } else if (isWeapon) {
      // Зброя: при невдачі падає
      // До +5: падає до +0
      // +5-+15: падає до +5
      // +15-+30: падає до +10
      // +30-+40: падає до +15
      if (currentEnchantLevel < 5) {
        newEnchantLevelAfterFail = 0;
      } else if (currentEnchantLevel < 15) {
        newEnchantLevelAfterFail = 5;
      } else if (currentEnchantLevel < 30) {
        newEnchantLevelAfterFail = 10;
      } else {
        newEnchantLevelAfterFail = 15;
      }
    } else {
      // Броня: залишається на тому ж рівні (безпечна заточка)
      newEnchantLevelAfterFail = currentEnchantLevel;
    }
    
    if (targetSlot && hero.equipment?.[targetSlot]) {
      // Оновлюємо рівень заточки екіпірованого предмета
      const updatedEquipmentEnchantLevels = {
        ...(hero.equipmentEnchantLevels || {}),
        [targetSlot]: newEnchantLevelAfterFail,
      };
      updateHero({
        inventory: updatedInventory,
        equipmentEnchantLevels: updatedEquipmentEnchantLevels,
      });
    } else if (targetItem) {
      // Оновлюємо рівень заточки предмета в інвентарі
      const updatedInventoryWithEnchant = updatedInventory.map((i: HeroInventoryItem) => {
        if (i.id === targetItemId) {
          return { ...i, enchantLevel: newEnchantLevelAfterFail };
        }
        return i;
      });
      updateHero({ inventory: updatedInventoryWithEnchant });
    }

    if (isBlessedScroll) {
      setAndPersist({
        log: [`❌ Заточка невдала! ${itemDef.name} впала до +${newEnchantLevelAfterFail} (безпечна заточка +3)`, ...state.log].slice(0, 30),
      });
    } else if (isWeapon) {
      setAndPersist({
        log: [`❌ Заточка невдала! ${itemDef.name} впала до +${newEnchantLevelAfterFail}`, ...state.log].slice(0, 30),
      });
    } else {
      setAndPersist({
        log: [`❌ Заточка невдала! ${itemDef.name} залишилася +${currentEnchantLevel} (безпечна заточка)`, ...state.log].slice(0, 30),
      });
    }
    return true;
  }
}

/**
 * Витягує грейд з ID заточки
 */
function getGradeFromScrollId(scrollId: string): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  const id = scrollId.toLowerCase();
  if (id.includes("_s_") || id.startsWith("s_")) return "S";
  if (id.includes("_a_") || id.startsWith("a_")) return "A";
  if (id.includes("_b_") || id.startsWith("b_")) return "B";
  if (id.includes("_c_") || id.startsWith("c_")) return "C";
  if (id.includes("_d_") || id.startsWith("d_")) return "D";
  if (id.includes("_ng_") || id.startsWith("ng_")) return "NG";
  return null;
}

/**
 * Витягує грейд з ID предмета
 */
function getGradeFromItemId(itemId: string): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  const id = itemId.toLowerCase();
  if (id.startsWith("s_") || id.includes("_s_")) return "S";
  if (id.startsWith("a_") || id.includes("_a_")) return "A";
  if (id.startsWith("b_") || id.includes("_b_")) return "B";
  if (id.startsWith("c_") || id.includes("_c_")) return "C";
  if (id.startsWith("d_") || id.includes("_d_")) return "D";
  if (id.startsWith("ng_") || id.includes("_ng_")) return "NG";
  return null;
}

