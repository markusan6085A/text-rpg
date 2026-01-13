// src/state/battle/actions/useSkill/shotHelpers.ts
import { useHeroStore } from "../../../heroStore";
import type { Hero } from "../../../../types/Hero";
import { itemsDB } from "../../../../data/items/itemsDB";
import { getWeaponGrade as getWeaponGradeFromArrowHelpers } from "./arrowHelpers";

export interface ShotResult {
  used: boolean;
  multiplier: number; // Множник урону (1.0 = без зміни, >1.0 = збільшений)
  shotType: "soulshot" | "spiritshot" | null;
}

/**
 * Визначає грейд зброї з екіпіровки
 */
function getWeaponGrade(hero: Hero): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  if (!hero?.equipment?.weapon) return null;
  
  const weaponId = hero.equipment.weapon;
  
  // Використовуємо функцію з arrowHelpers для кращого визначення грейду
  return getWeaponGradeFromArrowHelpers(weaponId);
}

/**
 * Знаходить відповідний shot в інвентарі за типом та грейдом
 */
function findShotInInventory(
  hero: Hero,
  shotType: "soulshot" | "spiritshot",
  weaponGrade: "NG" | "D" | "C" | "B" | "A" | "S" | null
): any | null {
  if (!hero?.inventory) return null;
  
  // Якщо грейд не визначено, спробуємо всі грейди по порядку (NG -> D -> C -> B -> A -> S)
  const gradesToTry = weaponGrade 
    ? [weaponGrade] 
    : ["NG", "D", "C", "B", "A", "S"];
  
  for (const grade of gradesToTry) {
    // Підтримуємо обидва формати: ng_soulshot та soulshot_ng для всіх грейдів
    let shotIds: string[] = [];
    
    // Формат: grade_shotType (ng_soulshot, d_soulshot, тощо)
    shotIds.push(`${grade.toLowerCase()}_${shotType}`);
    
    // Формат: shotType_grade (soulshot_ng, soulshot_d, тощо) - новий формат
    shotIds.push(`${shotType}_${grade.toLowerCase()}`);
    
    // Для NG-грейду також перевіряємо старі варіанти
    if (grade === "NG") {
      shotIds.push(`${shotType}_ng_silver`); // soulshot_ng_silver (тільки для soulshot)
      if (shotType === "soulshot") {
        shotIds.push("soulshot_ng_silver");
      }
    }
    
    // Шукаємо перший доступний shot зі списку
    for (const shotId of shotIds) {
      const shotItem = hero.inventory.find((item: any) => 
        item.id === shotId && (item.count ?? 0) > 0
      );
      
      if (shotItem) {
        return { item: shotItem, itemId: shotId };
      }
    }
  }
  
  return null;
}

/**
 * Перевіряє та використовує soulshot/spiritshot автоматично
 * @param hero - герой
 * @param isPhysical - чи це фізична атака
 * @param isMagic - чи це магічна атака
 * @returns результат використання shot (чи використано, множник урону)
 */
export function useAutoShot(
  hero: Hero,
  isPhysical: boolean,
  isMagic: boolean
): ShotResult {
  if (!hero?.inventory) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  // Визначаємо який shot потрібен:
  // - Маг скіл (isMagic=true) -> витрачає спріншоти
  // - Фізична атака (isPhysical=true) -> витрачає соулшоти
  const shotType = isMagic ? "spiritshot" : isPhysical ? "soulshot" : null;
  
  if (!shotType) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  // Визначаємо грейд зброї
  const weaponGrade = getWeaponGrade(hero);
  
  // Шукаємо відповідний shot в інвентарі
  const shotResult = findShotInInventory(hero, shotType, weaponGrade);
  
  if (!shotResult) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  const { item: shotItem, itemId: shotItemId } = shotResult;

  // Використовуємо shot - зменшуємо count
  const heroStore = useHeroStore.getState();
  const updatedInventory = hero.inventory.map((invItem: any) => {
    if (invItem.id === shotItemId) {
      const newCount = (invItem.count ?? 1) - 1;
      return newCount > 0 ? { ...invItem, count: newCount } : null;
    }
    return invItem;
  }).filter(Boolean) as any[];

  // Оновлюємо інвентар
  heroStore.updateHero({ inventory: updatedInventory });

  // Множник урону для shot (+40% урону)
  const damageMultiplier = 1.4; // +40% урону

  return {
    used: true,
    multiplier: damageMultiplier,
    shotType: shotType,
  };
}

/**
 * Перевіряє чи є spiritshot в інвентарі (для магів)
 * Використовується для збільшення хілів/бафів/зельїв в 2 рази
 */
export function hasSpiritshotActive(hero: Hero): boolean {
  if (!hero?.inventory) return false;
  
  // Перевіряємо всі грейди spiritshot
  const weaponGrade = getWeaponGrade(hero);
  const shotResult = findShotInInventory(hero, "spiritshot", weaponGrade);
  
  return !!shotResult;
}

