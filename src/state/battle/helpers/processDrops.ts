// src/state/battle/helpers/processDrops.ts
import type { Mob } from "../../../data/world/types";
import type { DropEntry, DropKind } from "../../../data/combat/types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { QUESTS } from "../../../data/quests";
import { equipItemLogic } from "../../heroStore/heroInventory";
import { INVENTORY_MAX_ITEMS } from "../../heroStore";
import { getPremiumMultiplier } from "../../../utils/premium/isPremiumActive";
import { reportMedalDrop } from "../../../utils/api";
import { useCharacterStore } from "../../characterStore";
import { getFloranMobDropProfile } from "../../../data/drop/floranMobDrops";

// Функція для видалення грейдів з назв ресурсів
// Грейди мають бути тільки в точках (enchant scrolls) та шмотках (equipment), але не в ресурсах
function removeGradeFromResourceName(name: string): string {
  if (!name) return name;
  
  let cleanedName = name;
  
  // Видаляємо грейди в квадратних дужках: [B], [D], [C], [B], [A], [S], [NG]
  cleanedName = cleanedName.replace(/\s*\[NG\]\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\[D\]\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\[C\]\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\[B\]\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\[A\]\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\[S\]\s*/gi, '');
  
  // Видаляємо грейди в круглих дужках: (NG), (D), (C), (B), (A), (S)
  cleanedName = cleanedName.replace(/\s*\(NG\)\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\(D\)\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\(C\)\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\(B\)\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\(A\)\s*/gi, '');
  cleanedName = cleanedName.replace(/\s*\(S\)\s*/gi, '');
  
  // Видаляємо грейди на початку назви: NG Material, D Material, тощо
  cleanedName = cleanedName.replace(/^(NG|D|C|B|A|S)\s+Material/i, 'Material');
  cleanedName = cleanedName.replace(/^(NG|D|C|B|A|S)\s+/i, '');
  
  // Видаляємо грейди в кінці назви: Material NG, Material D, тощо
  cleanedName = cleanedName.replace(/\s+(NG|D|C|B|A|S)\s+Material$/i, ' Material');
  cleanedName = cleanedName.replace(/\s+(NG|D|C|B|A|S)$/i, '');
  
  // Видаляємо подвійні пробіли та обрізаємо
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  
  return cleanedName;
}

/**
 * Обробляє дропи та спойли з моба та додає їх до інвентаря героя
 * @param mob - моб, якого вбили
 * @param hero - герой, який отримає дроп
 * @param spoiled - чи був моб спойлений
 * @returns об'єкт з новим інвентарем та повідомленнями про дроп
 */
export function processMobDrops(
  mob: Mob,
  hero: Hero,
  spoiled: boolean = false
): {
  newInventory: HeroInventoryItem[];
  dropMessages: string[];
  questProgressUpdates?: Array<{ questId: string; itemId: string; count: number }>;
  zaricheEquipped?: boolean; // Чи був одягнутий Зарич
  zaricheEquippedUntil?: number; // Timestamp коли Зарич буде знятий
  newEquipment?: Record<string, string | null>; // Оновлена екіпіровка (якщо Зарич випав)
  newEquipmentEnchantLevels?: Record<string, number>; // Оновлені рівні заточки (якщо Зарич випав)
} {
  const newInventory = [...(hero.inventory || [])];
  const dropMessages: string[] = [];
  const questProgressUpdates: Array<{ questId: string; itemId: string; count: number }> = [];

  // Перевіряємо, чи інвентар не повний
  const inventorySize = newInventory.filter(Boolean).length;
  const isInventoryFull = inventorySize >= INVENTORY_MAX_ITEMS;

  // Для Floran зон використовуємо профіль дропу (adena, weapon pieces тощо) — щоб опис і фактичний дроп збігались
  const isFloranMob = mob.id?.startsWith("fl_") || mob.id?.includes("floran") || mob.id?.startsWith("champ_floran");
  const floranProfile = isFloranMob ? getFloranMobDropProfile(mob) : undefined;
  const effectiveDrops: DropEntry[] = floranProfile
    ? floranProfile.items.map((item) => {
        const def = itemsDB[item.itemId];
        let kind: DropKind = "resource";
        if (item.itemId === "adena") kind = "adena";
        else if (def?.slot === "weapon" || def?.slot === "armor") kind = "equipment";
        else if (def?.slot) kind = "resource";
        return { id: item.itemId, kind, chance: item.chance, min: item.min, max: item.max };
      })
    : (mob.drops ?? []);

  // Спочатку перевіряємо загальний шанс дропа
  const hasDrop = Math.random() < (mob.dropChance ?? 0.5);

  if (hasDrop && effectiveDrops.length > 0) {
    // Обробляємо кожен дроп
    effectiveDrops.forEach((drop: DropEntry) => {
      const dropRoll = Math.random();
      if (dropRoll < drop.chance) {
        // Дроп випав!
        let itemCount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
        const itemDef = itemsDB[drop.id];
        
        // Преміум множник для ресурсів (тільки consumable, resource, quest)
        if (itemDef) {
          const resourceSlots = ["consumable", "resource", "quest"];
          if (resourceSlots.includes(itemDef.slot)) {
            const premiumMultiplier = getPremiumMultiplier(hero);
            itemCount = Math.round(itemCount * premiumMultiplier);
          }
        }

        if (itemDef) {
          // Перевіряємо, чи інвентар не повний
          // Якщо предмет може стакатися, перевіряємо, чи є вже такий предмет
          const stackableSlots = ["consumable", "resource", "quest"];
          const canStack = stackableSlots.includes(itemDef.slot);
          const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === drop.id);
          const canAddToExisting = canStack && existingItemIndex >= 0;

          // Якщо інвентар повний і не можна додати до існуючого предмета, пропускаємо дроп
          if (isInventoryFull && !canAddToExisting) {
            const displayName = removeGradeFromResourceName(itemDef.name);
            dropMessages.push(`Дроп: ${displayName} x${itemCount} (инвентарь полон!)`);
            return;
          }

          if (existingItemIndex >= 0) {
            // Якщо предмет вже є, збільшуємо кількість
            const existingItem = newInventory[existingItemIndex];
            newInventory[existingItemIndex] = {
              ...existingItem,
              count: (existingItem.count ?? 1) + itemCount,
            };
          } else {
            // Якщо предмета немає, додаємо новий
            newInventory.push({
              id: itemDef.id,
              name: itemDef.name,
              type: itemDef.kind,
              slot: itemDef.slot,
              icon: itemDef.icon,
              description: itemDef.description,
              stats: itemDef.stats,
              count: itemCount,
            } as HeroInventoryItem);
          }

          const displayName = removeGradeFromResourceName(itemDef.name);
          dropMessages.push(`Дроп: ${displayName} x${itemCount}`);
        }
      }
    });
  }

  // Обробляємо treasure box: падає з шансом 15% з мобів, рівень яких ±5 від рівня героя
  const heroLevel = hero.level || 1;
  const levelDiff = Math.abs(mob.level - heroLevel);
  if (levelDiff <= 5) {
    const treasureBoxChance = 0.15; // 15% шанс
    if (Math.random() < treasureBoxChance) {
      const treasureBoxId = "treasure_box";
      const itemDef = itemsDB[treasureBoxId];
      
      if (itemDef) {
        // Перевіряємо, чи інвентар не повний
        const stackableSlots = ["consumable", "resource", "quest"];
        const canStack = stackableSlots.includes(itemDef.slot);
        const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === treasureBoxId);
        const canAddToExisting = canStack && existingItemIndex >= 0;
        const currentInventorySize = newInventory.filter(Boolean).length;
        const isInventoryFullNow = currentInventorySize >= INVENTORY_MAX_ITEMS;

        // Якщо інвентар повний і не можна додати до існуючого предмета, пропускаємо
        if (!isInventoryFullNow || canAddToExisting) {
          const itemCount = 1;
          
          if (existingItemIndex >= 0) {
            // Якщо предмет вже є, збільшуємо кількість
            const existingItem = newInventory[existingItemIndex];
            newInventory[existingItemIndex] = {
              ...existingItem,
              count: (existingItem.count ?? 1) + itemCount,
            };
          } else {
            // Якщо предмета немає, додаємо новий
            newInventory.push({
              id: itemDef.id,
              name: itemDef.name,
              type: itemDef.kind,
              slot: itemDef.slot,
              icon: itemDef.icon,
              description: itemDef.description,
              stats: itemDef.stats,
              count: itemCount,
            } as HeroInventoryItem);
          }

          dropMessages.push(`Дроп: ${itemDef.name} x${itemCount}`);
        }
      }
    }
  }

  // Обробляємо спойли, якщо моб був спойлений
  if (spoiled && mob.spoil && mob.spoil.length > 0) {
    // Оновлюємо розмір інвентаря після дропів
    const currentInventorySize = newInventory.filter(Boolean).length;
    const isInventoryFullNow = currentInventorySize >= INVENTORY_MAX_ITEMS;

    mob.spoil.forEach((spoil: DropEntry) => {
      const spoilRoll = Math.random();
      if (spoilRoll < spoil.chance) {
        // Спойл випав!
        let itemCount = Math.floor(Math.random() * (spoil.max - spoil.min + 1)) + spoil.min;
        const itemDef = itemsDB[spoil.id];
        
        // Преміум множник для ресурсів (тільки consumable, resource, quest)
        if (itemDef) {
          const resourceSlots = ["consumable", "resource", "quest"];
          if (resourceSlots.includes(itemDef.slot)) {
            const premiumMultiplier = getPremiumMultiplier(hero);
            itemCount = Math.round(itemCount * premiumMultiplier);
          }
        }

        if (itemDef) {
          // Перевіряємо, чи інвентар не повний
          const stackableSlots = ["consumable", "resource", "quest"];
          const canStack = stackableSlots.includes(itemDef.slot);
          const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === spoil.id);
          const canAddToExisting = canStack && existingItemIndex >= 0;

          // Якщо інвентар повний і не можна додати до існуючого предмета, пропускаємо спойл
          if (isInventoryFullNow && !canAddToExisting) {
            const displayName = removeGradeFromResourceName(itemDef.name);
            dropMessages.push(`Спойл: ${displayName} x${itemCount} (инвентарь полон!)`);
            return;
          }

          if (existingItemIndex >= 0) {
            // Якщо предмет вже є, збільшуємо кількість
            const existingItem = newInventory[existingItemIndex];
            newInventory[existingItemIndex] = {
              ...existingItem,
              count: (existingItem.count ?? 1) + itemCount,
            };
          } else {
            // Якщо предмета немає, додаємо новий
            newInventory.push({
              id: itemDef.id,
              name: itemDef.name,
              type: itemDef.kind,
              slot: itemDef.slot,
              icon: itemDef.icon,
              description: itemDef.description,
              stats: itemDef.stats,
              count: itemCount,
            } as HeroInventoryItem);
          }

          const displayName = removeGradeFromResourceName(itemDef.name);
          dropMessages.push(`Спойл: ${displayName} x${itemCount}`);
        }
      }
    });
  }

  // ❗ ОБРОБКА КВЕСТОВИХ ДРОПІВ
  // Перевіряємо активні квести та додаємо квестові предмети, якщо моб відповідає
  const activeQuests = hero.activeQuests || [];

  activeQuests.forEach((activeQuest) => {
    const questDef = QUESTS.find((q) => q.id === activeQuest.questId);
    if (!questDef || !questDef.questDrops) return;

    // Перевіряємо, чи цей моб має квестові дропи
    questDef.questDrops.forEach((questDrop) => {
      if (mob.name === questDrop.mobName) {
        // Перераховуємо розмір інвентаря перед кожним квестовим предметом (щоб кілька дропів підряд не переповнювали)
        const currentInventorySizeForQuests = newInventory.filter(Boolean).length;
        const isInventoryFullForQuests = currentInventorySizeForQuests >= INVENTORY_MAX_ITEMS;

        // Перевіряємо інвентар для поточного прогресу
        const inventoryItem = newInventory.find((item: HeroInventoryItem) => item.id === questDrop.itemId);
        const currentItemCount = inventoryItem?.count || 0;
        const currentProgress = Math.min(currentItemCount, questDrop.requiredCount);
        
        // Перевіряємо, чи ще потрібно збирати цей предмет
        if (currentProgress < questDrop.requiredCount) {
          // Перевіряємо, чи інвентар не повний (квестові предмети завжди можуть стакатися)
          const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === questDrop.itemId);
          const canAddToExisting = existingItemIndex >= 0;

          // Якщо інвентар повний і не можна додати до існуючого предмета, пропускаємо квестовий дроп
          if (isInventoryFullForQuests && !canAddToExisting) {
            dropMessages.push(`Квест: ${itemsDB[questDrop.itemId]?.name || questDrop.itemId} x1 (инвентарь полон!)`);
            return;
          }

          // Шанс дропу квестового предмета (100%)
          if (Math.random() < 1.0) {
            const itemDef = itemsDB[questDrop.itemId];
            if (itemDef) {
              // Шукаємо, чи вже є такий предмет в інвентарі
              const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === questDrop.itemId);

              if (existingItemIndex >= 0) {
                // Якщо предмет вже є, збільшуємо кількість
                const existingItem = newInventory[existingItemIndex];
                const newCount = (existingItem.count ?? 1) + 1;
                newInventory[existingItemIndex] = {
                  ...existingItem,
                  count: newCount,
                };
                
                // Формат: Квест: Назва x1 5(15)
                const displayProgress = Math.min(newCount, questDrop.requiredCount);
                dropMessages.push(`Квест: ${itemDef.name} x1 ${displayProgress}(${questDrop.requiredCount})`);
              } else {
                // Якщо предмета немає, додаємо новий
                newInventory.push({
                  id: itemDef.id,
                  name: itemDef.name,
                  type: itemDef.kind,
                  slot: itemDef.slot,
                  icon: itemDef.icon,
                  description: itemDef.description,
                  stats: itemDef.stats,
                  count: 1,
                } as HeroInventoryItem);
                
                // Формат: Квест: Назва x1 1(15)
                dropMessages.push(`Квест: ${itemDef.name} x1 1(${questDrop.requiredCount})`);
              }
              
              // Додаємо оновлення прогресу квесту
              questProgressUpdates.push({
                questId: activeQuest.questId,
                itemId: questDrop.itemId,
                count: 1,
              });
            }
          }
        }
      }
    });
  });

  // ❗ ОБРОБКА ЗАРИЧА - 1% шанс випадання з будь-якого моба
  let zaricheEquipped = false;
  let zaricheEquippedUntil: number | undefined = undefined;
  let newEquipment: Record<string, string | null> | undefined = undefined;
  let newEquipmentEnchantLevels: Record<string, number> | undefined = undefined;
  
  // Перевіряємо, чи Зарич вже одягнутий (не можна одягнути другий раз)
  const zaricheAlreadyEquipped = hero.equipment?.weapon === "zariche";
  
  if (!zaricheAlreadyEquipped && Math.random() < 0.01) {
    // Зарич випав! (1% шанс)
    const zaricheDef = itemsDB["zariche"];
    if (zaricheDef) {
      // Створюємо предмет Зарича
      const zaricheItem: HeroInventoryItem = {
        id: zaricheDef.id,
        name: zaricheDef.name,
        type: zaricheDef.kind,
        slot: zaricheDef.slot,
        icon: zaricheDef.icon,
        description: zaricheDef.description,
        stats: zaricheDef.stats,
        count: 1,
        grade: zaricheDef.grade,
      };

      // Автоматично одягаємо Зарича
      const heroWithZariche = equipItemLogic(hero, zaricheItem);
      
      // Оновлюємо інвентар (стара зброя, щит та пуха повертаються в інвентар)
      heroWithZariche.inventory.forEach((item) => {
        const existingIndex = newInventory.findIndex((invItem) => invItem.id === item.id);
        if (existingIndex >= 0) {
          // Якщо предмет вже є, оновлюємо його (може бути збільшена кількість)
          const existingItem = newInventory[existingIndex];
          if (existingItem.count && item.count) {
            newInventory[existingIndex] = { ...existingItem, count: existingItem.count + item.count };
          } else {
            newInventory[existingIndex] = item;
          }
        } else {
          newInventory.push(item);
        }
      });

      // Зберігаємо оновлену екіпіровку та рівні заточки
      newEquipment = heroWithZariche.equipment;
      newEquipmentEnchantLevels = heroWithZariche.equipmentEnchantLevels;

      // Встановлюємо таймер на 1 годину (3600000 мс)
      zaricheEquippedUntil = Date.now() + 60 * 60 * 1000;
      zaricheEquipped = true;

      dropMessages.push(`🎉 ЗАРИЧ ВИПАВ! Автоматично одягнуто на 1 годину!`);
    }
  }

  // 🔥 Медальки 7 Печатей (5% шанс, тільки понеділок-п'ятниця польський час; в суботу 00:00 зникають)
  const isEventActive = () => {
    const now = new Date();
    const polandTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
    const dayOfWeek = polandTime.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Понеділок-п'ятниця
  };

  if (isEventActive() && Math.random() < 0.05) {
    // Медалька випала!
    const medalId = "seven_seals_medal";
    const medalDef = itemsDB[medalId];
    
    if (medalDef) {
      const existingMedalIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === medalId);
      
      if (existingMedalIndex >= 0) {
        // Якщо медалька вже є, збільшуємо кількість
        const existingMedal = newInventory[existingMedalIndex];
        newInventory[existingMedalIndex] = {
          ...existingMedal,
          count: (existingMedal.count ?? 1) + 1,
        };
      } else {
        // Якщо медальки немає, додаємо нову
        if (!isInventoryFull) {
          newInventory.push({
            id: medalDef.id,
            name: medalDef.name,
            type: "quest" as const,
            slot: medalDef.slot,
            icon: medalDef.icon,
            description: medalDef.description,
            stats: medalDef.stats,
            count: 1,
          } as HeroInventoryItem);
        }
      }
      
      dropMessages.push(`🎖️ Медаль Печатей випала!`);
      
      // 🔥 Відправляємо на сервер для рейтингу — використовуємо characterId з store (hero.id може бути hero_xxx)
      const characterId = useCharacterStore.getState().characterId;
      if (characterId) {
        reportMedalDrop(characterId).catch((err) => {
          console.error("Error reporting medal drop:", err);
        });
      }
    }
  }

  return {
    newInventory,
    dropMessages,
    questProgressUpdates: questProgressUpdates.length > 0 ? questProgressUpdates : undefined,
    zaricheEquipped,
    zaricheEquippedUntil,
    newEquipment,
    newEquipmentEnchantLevels,
  };
}

