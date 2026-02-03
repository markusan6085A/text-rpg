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

/** Чи itemId є soulshot або spiritshot */
export function isShotConsumable(itemId: string, shotType: "soulshot" | "spiritshot"): boolean {
  return itemId.startsWith(shotType);
}

/**
 * Використовує soulshot/spiritshot тільки якщо гравець увімкнув заряд на панелі (клік по слоту).
 * @param hero - герой
 * @param isPhysical - чи це фізична атака
 * @param isMagic - чи це магічна атака
 * @param loadoutSlots - слоти панелі
 * @param activeChargeSlots - індекси слотів, де заряд увімкнено
 */
export function useAutoShot(
  hero: Hero,
  isPhysical: boolean,
  isMagic: boolean,
  loadoutSlots: (number | string | null)[] = [],
  activeChargeSlots: number[] = []
): ShotResult {
  if (!hero?.inventory) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  const shotType = isMagic ? "spiritshot" : isPhysical ? "soulshot" : null;
  if (!shotType) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  // Шукаємо слот з відповідним зарядом, який увімкнений
  for (const slotIndex of activeChargeSlots) {
    const slotId = loadoutSlots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    const itemId = slotId.replace("consumable:", "");
    if (!isShotConsumable(itemId, shotType)) continue;
    const invItem = hero.inventory.find((i: any) => i.id === itemId && (i.count ?? 0) > 0);
    if (!invItem) continue;

    // Використовуємо один заряд
    const heroStore = useHeroStore.getState();
    const updatedInventory = hero.inventory.map((inv: any) => {
      if (inv.id !== itemId) return inv;
      const newCount = (inv.count ?? 1) - 1;
      return newCount > 0 ? { ...inv, count: newCount } : null;
    }).filter(Boolean) as any[];
    heroStore.updateHero({ inventory: updatedInventory });

    return {
      used: true,
      multiplier: 1.4,
      shotType,
    };
  }

  return { used: false, multiplier: 1.0, shotType: null };
}

/**
 * Перевіряє чи spiritshot увімкнений на панелі і є в інвентарі (для магів, хіл x2).
 */
export function hasSpiritshotActive(
  hero: Hero,
  loadoutSlots: (number | string | null)[] = [],
  activeChargeSlots: number[] = []
): boolean {
  if (!hero?.inventory) return false;
  for (const slotIndex of activeChargeSlots) {
    const slotId = loadoutSlots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    const itemId = slotId.replace("consumable:", "");
    if (!isShotConsumable(itemId, "spiritshot")) continue;
    const has = hero.inventory.some((i: any) => i.id === itemId && (i.count ?? 0) > 0);
    if (has) return true;
  }
  return false;
}

