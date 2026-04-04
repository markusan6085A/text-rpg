// src/state/battle/actions/enchantScroll.ts
import type { BattleState } from "../types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../heroStore";
import { getGradeFromScrollId, getGradeFromItemId } from "../../../utils/enchantHelpers";

/** Один рядок інвентаря без flatMap-розщеплення: при count>1 не створюємо другу «пуху» зі старою заточкою. */
function applyInventoryEnchantOneRow(
  inventory: HeroInventoryItem[],
  targetItemId: string,
  currentEnchantLevel: number,
  newEnchantLevel: number
): HeroInventoryItem[] {
  let applied = false;
  return inventory.map((i) => {
    if (applied || i.id !== targetItemId || (i.enchantLevel || 0) !== currentEnchantLevel) {
      return i;
    }
    applied = true;
    return { ...i, enchantLevel: newEnchantLevel, count: i.count ?? 1 };
  });
}

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
): { applied: false } | { applied: true; success: boolean; newLevel: number } {
  const heroStore = useHeroStore.getState();
  const currentHero = heroStore.hero;
  if (!currentHero) {
    setAndPersist({
      log: [`Помилка: герой не знайдено`, ...state.log].slice(0, 30),
    });
    return { applied: false };
  }

  // Перевіряємо чи є заточка в інвентарі
  const scrollItem = currentHero.inventory.find((i: HeroInventoryItem) => i.id === scrollItemId);
  if (!scrollItem || (scrollItem.count ?? 0) <= 0) {
    setAndPersist({
      log: [`Немає заточки в інвентарі`, ...state.log].slice(0, 30),
    });
    return { applied: false };
  }

  // Визначаємо тип заточки (зброя чи броня)
  const isWeaponScroll = scrollItemId.includes("weapon");
  const isArmorScroll = scrollItemId.includes("armor");

  if (!isWeaponScroll && !isArmorScroll) {
    setAndPersist({
      log: [`Невідомий тип заточки`, ...state.log].slice(0, 30),
    });
    return { applied: false };
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
      return { applied: false };
    }
    currentEnchantLevel = hero.equipmentEnchantLevels?.[targetSlot] ?? 0;
  } else {
    // Предмет в інвентарі
    targetItem = currentHero.inventory.find((i: HeroInventoryItem) => i.id === targetItemId) || null;
    if (!targetItem) {
      setAndPersist({
        log: [`Предмет не знайдено в інвентарі`, ...state.log].slice(0, 30),
      });
      return { applied: false };
    }
    currentEnchantLevel = targetItem.enchantLevel ?? 0;
  }

  // Перевіряємо чи предмет відповідає типу заточки
  const itemDef = itemsDB[targetItemId];
  if (!itemDef) {
    setAndPersist({
      log: [`Предмет не знайдено в базі даних`, ...state.log].slice(0, 30),
    });
    return { applied: false };
  }

  const isWeapon = itemDef.kind === "weapon";
  // Заточки для броні працюють з: бронею, шоломом, рукавицями, чоботами, щитом, біжутерією, поясом, плащем
  const isArmor = ["armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.kind || "") ||
                  ["necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.slot || "");

  if (isWeaponScroll && !isWeapon) {
    setAndPersist({
      log: [`Ця заточка тільки для зброї!`, ...state.log].slice(0, 30),
    });
    return { applied: false };
  }

  if (isArmorScroll && !isArmor) {
    setAndPersist({
      log: [`Ця заточка тільки для броні!`, ...state.log].slice(0, 30),
    });
    return { applied: false };
  }

  // Перевіряємо грейд заточки та предмета (броня/зброя мають grade в itemDef, бижутерія — часто в id)
  const scrollGrade = getGradeFromScrollId(scrollItemId);
  const itemGrade = itemDef.grade ?? getGradeFromItemId(targetItemId);

  if (scrollGrade && itemGrade && scrollGrade !== itemGrade) {
    setAndPersist({
      log: [`Грейд заточки (${scrollGrade}) не відповідає грейду предмета (${itemGrade})!`, ...state.log].slice(0, 30),
    });
    return { applied: false };
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
  // GM Giant scroll — завжди 100% успіх (itemsDB_gm_giant_enchants)
  const isGmGiantEnchantScroll = /^gm_giant_enchant_(weapon|armor)_(d|c|b|a|s)$/i.test(scrollItemId);

  // Визначаємо шанс успіху заточки залежно від типу та поточного рівня
  let successChance: number;

  if (isWeapon) {
    // Зброя: максимальна заточка +40
    if (currentEnchantLevel >= 40) {
      setAndPersist({
        log: [`⚠️ ${itemDef.name} вже має максимальну заточку +40!`, ...state.log].slice(0, 30),
      });
      return { applied: false };
    }
    if (isGmGiantEnchantScroll) {
      successChance = 1;
    } else if (currentEnchantLevel < 5) {
      successChance = 1.0; // 100%
    } else if (currentEnchantLevel < 15) {
      successChance = 0.8; // 80%
    } else if (currentEnchantLevel < 30) {
      successChance = 0.7; // 70%
    } else {
      successChance = 0.6; // 60%
    }
  } else {
    // Броня/біжутерія/пояс/плащ: максимальна заточка +30
    if (currentEnchantLevel >= 30) {
      setAndPersist({
        log: [`⚠️ ${itemDef.name} вже має максимальну заточку +30!`, ...state.log].slice(0, 30),
      });
      return { applied: false };
    }
    if (isGmGiantEnchantScroll) {
      successChance = 1;
    } else if (currentEnchantLevel < 3) {
      successChance = 1.0; // 100%
    } else if (currentEnchantLevel < 10) {
      successChance = 0.9; // 90%
    } else if (currentEnchantLevel < 20) {
      successChance = 0.8; // 80%
    } else {
      successChance = 0.7; // 70%
    }
  }

  // Для blessed scrolls встановлюємо мінімальний шанс успіху 95% (Giant GM уже 100%)
  if (isBlessedScroll && !isGmGiantEnchantScroll) {
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
      updateHero({
        inventory: applyInventoryEnchantOneRow(
          updatedInventory,
          targetItemId,
          currentEnchantLevel,
          newEnchantLevel
        ),
      });
    }

    setAndPersist({
      log: [`✅ Заточка успішна! ${itemDef.name} тепер +${newEnchantLevel}`, ...state.log].slice(0, 30),
    });
    return { applied: true, success: true, newLevel: newEnchantLevel };
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
      updateHero({
        inventory: applyInventoryEnchantOneRow(
          updatedInventory,
          targetItemId,
          currentEnchantLevel,
          newEnchantLevelAfterFail
        ),
      });
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
    return { applied: true, success: false, newLevel: newEnchantLevelAfterFail };
  }
}

