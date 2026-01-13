// src/state/battle/actions/useConsumable.ts
import type { BattleState } from "../types";
import type { Hero } from "../../../types/Hero";
import { useHeroStore } from "../../heroStore";
import { itemsDB } from "../../../data/items/itemsDB";
import { getMaxResources } from "../helpers/getMaxResources";
import { hasSpiritshotActive } from "./useSkill/shotHelpers";
import { computeBuffedMaxResources } from "../helpers";
import { cleanupBuffs } from "../helpers";
import { handleEnchantScroll } from "./enchantScroll";

// КД для банок HP/MP (1 секунда = 1000 мс)
const POTION_COOLDOWN_MS = 1000;

export function handleConsumable(
  consumableId: string, // "consumable:ng_small_hp_potion"
  state: BattleState,
  hero: Hero,
  now: number,
  setAndPersist: (updates: Partial<BattleState>) => void,
  updateHero: (partial: Partial<Hero>) => void
): boolean {
  // Витягуємо itemId з рядкового ID
  const itemId = consumableId.replace("consumable:", "");
  const itemDef = itemsDB[itemId];
  
  if (!itemDef) {
    setAndPersist({
      log: [`Предмет не знайдено: ${itemId}`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Перевіряємо чи є предмет в інвентарі
  const heroStore = useHeroStore.getState();
  const currentHero = heroStore.hero;
  if (!currentHero?.inventory) {
    setAndPersist({
      log: [`Немає інвентаря`, ...state.log].slice(0, 30),
    });
    return false;
  }

  const invItem = currentHero.inventory.find((i: any) => i.id === itemId);
  if (!invItem || (invItem.count ?? 0) <= 0) {
    setAndPersist({
      log: [`Немає ${itemDef.name} в інвентарі`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Отримуємо максимальні ресурси з урахуванням бафів
  const baseMax = getMaxResources(hero);
  const activeBuffs = cleanupBuffs(state.heroBuffs || [], now);
  const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, activeBuffs);

  // Перевірка чи це банка HP, MP або CP
  const isHpPotion = itemId.includes("hp_potion") || itemId.includes("healing_potion") || (itemId.includes("hp") && itemId.includes("potion")) || itemDef.restoreHp !== undefined;
  const isMpPotion = itemId.includes("mp_potion") || itemId.includes("mana_potion") || (itemId.includes("mp") && itemId.includes("potion")) || itemDef.restoreMp !== undefined;
  const isCpPotion = itemId.includes("cp_potion") || itemDef.restoreCp !== undefined;

  if (isHpPotion || isMpPotion || isCpPotion) {
    // Перевірка КД для банок HP/MP/CP (використовуємо cooldowns map)
    const cooldownKey = isHpPotion ? -100 : (isMpPotion ? -101 : -102); // Унікальні ID для КД банок
    const lastUsed = state.cooldowns?.[cooldownKey];
    if (lastUsed && now - lastUsed < POTION_COOLDOWN_MS) {
      const remaining = Math.ceil((POTION_COOLDOWN_MS - (now - lastUsed)) / 1000);
      setAndPersist({
        log: [`КД: ${remaining} сек`, ...state.log].slice(0, 30),
      });
      return false;
    }

    // Відновлення HP
    if (isHpPotion) {
      // Читаємо поточне HP з hero (єдине джерело правди)
      const currentHp = Math.min(maxHp, hero.hp ?? maxHp);
      
      // Визначаємо значення відновлення з itemsDB або за замовчуванням
      let healAmount = 200; // Малі банки за замовчуванням
      
      // Перевіряємо чи є restoreHp в itemsDB (для великих банок)
      if (itemDef.restoreHp !== undefined) {
        healAmount = itemDef.restoreHp;
      } else if (itemId.includes("greater") || itemId.includes("Велика") || itemDef.name.includes("Велика")) {
        healAmount = 500; // Великі банки
      } else if (itemId.includes("small") || itemId.includes("Мала") || itemDef.name.includes("Мала")) {
        healAmount = 200; // Малі банки
      }
      
      // Якщо є spiritshot - збільшуємо хіл в 2 рази (для магів)
      const spiritshotActive = hasSpiritshotActive(hero);
      if (spiritshotActive) {
        healAmount = Math.round(healAmount * 2);
      }
      
      // Обчислюємо нове HP (не більше maxHp з бафами)
      const newHp = Math.min(maxHp, currentHp + healAmount);
      
      // Зменшуємо кількість в інвентарі
      const updatedInventory = currentHero.inventory.map((i: any) => {
        if (i.id === itemId) {
          const newCount = (i.count ?? 1) - 1;
          return newCount > 0 ? { ...i, count: newCount } : null;
        }
        return i;
      }).filter(Boolean) as any[];

      // Оновлюємо HP та інвентар (важливо: оновлюємо обидва одночасно)
      updateHero({ hp: newHp, inventory: updatedInventory });
      
      // Встановлюємо КД
      setAndPersist({
        log: [`Ви використали ${itemDef.name} (+${healAmount} HP)`, ...state.log].slice(0, 30),
        cooldowns: {
          ...(state.cooldowns || {}),
          [cooldownKey]: now,
        },
      });
      return true;
    }

    // Відновлення MP
    if (isMpPotion) {
      // Читаємо поточне MP з hero (єдине джерело правди)
      const currentMp = Math.min(maxMp, hero.mp ?? maxMp);
      
      // Визначаємо значення відновлення з itemsDB або за замовчуванням
      let restoreAmount = 200; // Малі банки за замовчуванням
      
      // Перевіряємо чи є restoreMp в itemsDB (для великих банок)
      if (itemDef.restoreMp !== undefined) {
        restoreAmount = itemDef.restoreMp;
      } else if (itemId.includes("greater") || itemId.includes("Велика") || itemDef.name.includes("Велика")) {
        restoreAmount = 500; // Великі банки
      } else if (itemId.includes("small") || itemId.includes("Мала") || itemDef.name.includes("Мала")) {
        restoreAmount = 200; // Малі банки
      }
      
      // Обчислюємо нове MP (не більше maxMp з бафами)
      const newMp = Math.min(maxMp, currentMp + restoreAmount);
      
      // Зменшуємо кількість в інвентарі
      const updatedInventory = currentHero.inventory.map((i: any) => {
        if (i.id === itemId) {
          const newCount = (i.count ?? 1) - 1;
          return newCount > 0 ? { ...i, count: newCount } : null;
        }
        return i;
      }).filter(Boolean) as any[];

      // Оновлюємо MP та інвентар (важливо: оновлюємо обидва одночасно)
      updateHero({ mp: newMp, inventory: updatedInventory });
      
      // Встановлюємо КД
      setAndPersist({
        log: [`Ви використали ${itemDef.name} (+${restoreAmount} MP)`, ...state.log].slice(0, 30),
        cooldowns: {
          ...(state.cooldowns || {}),
          [cooldownKey]: now,
        },
      });
      return true;
    }

    // Відновлення CP
    if (isCpPotion) {
      // Читаємо поточне CP з hero (єдине джерело правди)
      const currentCp = Math.min(maxCp, hero.cp ?? maxCp);
      
      // Визначаємо значення відновлення з itemsDB або за замовчуванням
      let restoreAmount = 500; // CP банки за замовчуванням
      
      // Перевіряємо чи є restoreCp в itemsDB
      if (itemDef.restoreCp !== undefined) {
        restoreAmount = itemDef.restoreCp;
      }
      
      // Обчислюємо нове CP (не більше maxCp з бафами)
      const newCp = Math.min(maxCp, currentCp + restoreAmount);
      
      // Зменшуємо кількість в інвентарі
      const updatedInventory = currentHero.inventory.map((i: any) => {
        if (i.id === itemId) {
          const newCount = (i.count ?? 1) - 1;
          return newCount > 0 ? { ...i, count: newCount } : null;
        }
        return i;
      }).filter(Boolean) as any[];

      // Оновлюємо CP та інвентар (важливо: оновлюємо обидва одночасно)
      updateHero({ cp: newCp, inventory: updatedInventory });
      
      // Встановлюємо КД
      setAndPersist({
        log: [`Ви використали ${itemDef.name} (+${restoreAmount} CP)`, ...state.log].slice(0, 30),
        cooldowns: {
          ...(state.cooldowns || {}),
          [cooldownKey]: now,
        },
      });
      return true;
    }
  }

  // Перевірка чи це заточка
  const isEnchantScroll = itemId.includes("enchant_weapon_scroll") || itemId.includes("enchant_armor_scroll");
  
  if (isEnchantScroll) {
    // Заточки не можна використовувати в бою - потрібен окремий UI
    setAndPersist({
      log: [`${itemDef.name} можна використати тільки поза боєм`, ...state.log].slice(0, 30),
    });
    return false;
  }

  // Для інших расходників (soulshot, spiritshot тощо) можна додати логіку пізніше
  setAndPersist({
    log: [`${itemDef.name} не може бути використаний в бою`, ...state.log].slice(0, 30),
  });
  return false;
}

