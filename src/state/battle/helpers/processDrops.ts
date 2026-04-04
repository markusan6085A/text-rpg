// src/state/battle/helpers/processDrops.ts
import type { Mob } from "../../../data/world/types";
import type { DropEntry, DropKind } from "../../../data/combat/types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { getL2dopResourceIconPath, getL2DropEntryByItemIdPath } from "../../../data/world/l2dop/droplistMapping";
import { QUESTS } from "../../../data/quests";
import { getEffectiveQuestDropNeed } from "../../../utils/quests/questDropEffectiveNeed";
import { mobMatchesQuestDropName } from "../../../utils/quests/questDropMobMatch";
import { mergeActiveQuestsForUi } from "../../../utils/quests/mergeActiveQuestsForUi";
import { getInventoryMax } from "../../heroStore";
import { addItemsWithOverflow, isStackableHeroItem } from "../../heroStore/inventoryOverflow";
import { getPremiumMultiplier } from "../../../utils/premium/isPremiumActive";
import { reportMedalDrop } from "../../../utils/api";
import { useCharacterStore } from "../../characterStore";
import { getFloranMobDropProfile } from "../../../data/drop/floranMobDrops";
import { MOB_LOOT_TABLES_DISABLED } from "./mobLootTablesDisabled";
import { resourceLootDisplayName } from "../../../utils/resourceLootDisplayName";
import { isSevenSealsFarmWindowActive } from "../../../utils/sevenSealsTime";
import { rollMysticSpellbookDropForMobKill } from "./mysticSpellbookDrops";

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
 * Roll як у L2 droplist: R = випадкове ціле з [0, 1_000_000), успіх якщо R < chancePerMillion
 * (аналог RAND(1_000_000) у серверних скриптах).
 */
function rollDropEntry(entry: DropEntry): boolean {
  const cpm = entry.chancePerMillion;
  if (cpm != null && cpm > 0) {
    const cap = Math.min(1_000_000, Math.max(0, Math.floor(cpm)));
    const r = Math.floor(Math.random() * 1_000_000);
    return r < cap;
  }
  return Math.random() < (entry.chance ?? 0);
}

function rollQuantity(min: number, max: number): number {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function resolveDropIconPath(drop: DropEntry): string {
  const fromMap = getL2dopResourceIconPath(drop.id);
  if (fromMap) return fromMap;
  const byItem = getL2DropEntryByItemIdPath(drop);
  if (byItem) return byItem;
  return "/items/default_item.png";
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
  spoiled: boolean = false,
  battleZoneId?: string | null
): {
  newInventory: HeroInventoryItem[];
  dropMessages: string[];
  /** Адена з таблиці дропу (профіль Floran або mob.drops) — додавати до hero.adena, не в інвентар */
  adenaFromDrops: number;
  questProgressUpdates?: Array<{ questId: string; itemId: string; count: number }>;
  zaricheEquipped?: boolean; // Чи був одягнутий Зарич
  zaricheEquippedUntil?: number; // Timestamp коли Зарич буде знятий
  newEquipment?: Record<string, string | null>; // Оновлена екіпіровка (якщо Зарич випав)
  newEquipmentEnchantLevels?: Record<string, number>; // Оновлені рівні заточки (якщо Зарич випав)
  /** Фактичні предмети що випали (для новин raid boss) */
  actualDroppedItems?: Array<{ id: string; name: string; count: number }>;
  overflowChest?: HeroInventoryItem[];
} {
  const newInventory = [...(hero.inventory || [])];
  const dropMessages: string[] = [];
  const actualDroppedItems: Array<{ id: string; name: string; count: number }> = [];
  const itemsToAdd: HeroInventoryItem[] = []; // Предмети, що не вмістились — підуть в overflow
  let adenaFromDrops = 0;
  const questProgressUpdates: Array<{ questId: string; itemId: string; count: number }> = [];

  // Перевіряємо, чи інвентар не повний (максимум слотів — 100+ куплені за Coin of Luck)
  const maxSlots = getInventoryMax(hero);
  const inventorySize = newInventory.filter(Boolean).length;
  const isInventoryFull = inventorySize >= maxSlots;

  let effectiveDrops: DropEntry[] = [];
  if (!MOB_LOOT_TABLES_DISABLED) {
    // Для Floran зон використовуємо профіль дропу (adena, weapon pieces тощо) + ресурси з mob.drops
    const isFloranMob =
      mob.id?.startsWith("fl_") || mob.id?.includes("floran") || mob.id?.startsWith("champ_floran");
    const floranProfile = isFloranMob ? getFloranMobDropProfile(mob) : undefined;
    const floranDrops: DropEntry[] = floranProfile
      ? floranProfile.items.map((item) => {
          const def = itemsDB[item.itemId];
          let kind: DropKind = "resource";
          if (item.itemId === "adena") kind = "adena";
          else if (def?.slot === "weapon" || def?.slot === "armor") kind = "equipment";
          else if (def?.slot) kind = "resource";
          return { id: item.itemId, kind, chance: item.chance, min: item.min, max: item.max };
        })
      : [];
    const zoneResourceDrops = mob.drops ?? [];
    effectiveDrops = floranProfile ? [...floranDrops, ...zoneResourceDrops] : zoneResourceDrops;
  }


  // L2 XML: рядки з chancePerMillion крутяться кожен окремо (без «глобального» шансу зони).
  // Класичні рядки (Floran тощо без cpm) — один раз mob.dropChance, потім roll по кожному рядку.
  const l2LineDrops = effectiveDrops.filter((d) => d.chancePerMillion != null && d.chancePerMillion > 0);
  const classicLineDrops = effectiveDrops.filter((d) => d.chancePerMillion == null || d.chancePerMillion <= 0);

  const applyOneDropLine = (drop: DropEntry) => {
    if (!rollDropEntry(drop)) return;

    let itemCount = rollQuantity(drop.min ?? 1, drop.max ?? 1);
    const itemDef = itemsDB[drop.id];

    if (drop.id === "adena" || drop.kind === "adena") {
      const premiumMultiplier = getPremiumMultiplier(hero);
      const amount = Math.round(itemCount * premiumMultiplier);
      adenaFromDrops += amount;
      dropMessages.push(`Дроп: Адена x${amount}`);
      actualDroppedItems.push({ id: "adena", name: "Адена", count: amount });
      return;
    }

    if (drop.kind === "equipment" && !itemDef) return;

    const premiumMultiplier = getPremiumMultiplier(hero);
    if (itemDef) {
      const resourceSlots = ["consumable", "resource", "quest"];
      if (resourceSlots.includes(itemDef.slot)) {
        itemCount = Math.round(itemCount * premiumMultiplier);
      }
    } else if (drop.kind === "resource" || drop.id.startsWith("l2item_")) {
      itemCount = Math.round(itemCount * premiumMultiplier);
    }

    if (itemDef) {
      const canStack = isStackableHeroItem({ id: itemDef.id, slot: itemDef.slot, kind: itemDef.kind, stackable: itemDef.stackable } as any);
      const existingItemIndex = canStack ? newInventory.findIndex((item: HeroInventoryItem) => item.id === drop.id && !(item as any).meta?.hasLSPassive) : -1;
      const canAddToExisting = canStack && existingItemIndex >= 0;

      if (isInventoryFull && !canAddToExisting) {
        const displayName = removeGradeFromResourceName(itemDef.name);
        const itemToAdd = { id: itemDef.id, name: itemDef.name, type: itemDef.kind, slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: itemCount } as HeroInventoryItem;
        itemsToAdd.push(itemToAdd);
        dropMessages.push(`Дроп: ${displayName} x${itemCount} → сундук переповнення`);
        actualDroppedItems.push({ id: drop.id, name: displayName, count: itemCount });
        return;
      }

      if (existingItemIndex >= 0) {
        const existingItem = newInventory[existingItemIndex];
        newInventory[existingItemIndex] = {
          ...existingItem,
          count: (existingItem.count ?? 1) + itemCount,
        };
      } else if (canStack) {
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
      } else {
        for (let i = 0; i < itemCount; i++) {
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
        }
      }

      const displayName = removeGradeFromResourceName(itemDef.name);
      dropMessages.push(`Дроп: ${displayName} x${itemCount}`);
      actualDroppedItems.push({ id: drop.id, name: displayName, count: itemCount });
      return;
    }

    if (drop.kind !== "resource" && !drop.id.startsWith("l2item_")) return;

    const displayName = removeGradeFromResourceName(
      drop.displayName ?? resourceLootDisplayName(drop.id)
    );
    const iconPath = resolveDropIconPath(drop);
    const syn: HeroInventoryItem = {
      id: drop.id,
      name: displayName,
      type: "resource",
      slot: "resource",
      icon: iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`,
      description: "",
      count: itemCount,
    };
    const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === drop.id && !(item as any).meta?.hasLSPassive);
    const canAddToExisting = existingItemIndex >= 0;

    if (isInventoryFull && !canAddToExisting) {
      itemsToAdd.push(syn);
      dropMessages.push(`Дроп: ${displayName} x${itemCount} → сундук переповнення`);
      actualDroppedItems.push({ id: drop.id, name: displayName, count: itemCount });
      return;
    }

    if (existingItemIndex >= 0) {
      const existingItem = newInventory[existingItemIndex];
      newInventory[existingItemIndex] = {
        ...existingItem,
        count: (existingItem.count ?? 1) + itemCount,
      };
    } else {
      newInventory.push(syn);
    }
    dropMessages.push(`Дроп: ${displayName} x${itemCount}`);
    actualDroppedItems.push({ id: drop.id, name: displayName, count: itemCount });
  };

  l2LineDrops.forEach(applyOneDropLine);

  if (classicLineDrops.length > 0 && Math.random() < (mob.dropChance ?? 0.5)) {
    classicLineDrops.forEach(applyOneDropLine);
  }

  // Treasure Box: лише з мобів у межах ±3 рівнів від героя
  const heroLevel = hero.level || 1;
  const levelDiff = Math.abs(mob.level - heroLevel);
  const treasureBoxMaxLevelDiff = 3;
  if (!MOB_LOOT_TABLES_DISABLED && levelDiff <= treasureBoxMaxLevelDiff) {
    const treasureBoxChance = 0.1;
    if (Math.random() < treasureBoxChance) {
      const treasureBoxId = "treasure_box";
      const itemDef = itemsDB[treasureBoxId];
      
      if (itemDef) {
        // Перевіряємо, чи інвентар не повний
        const canStack = isStackableHeroItem({ id: itemDef.id, slot: itemDef.slot, kind: itemDef.kind, stackable: itemDef.stackable } as any);
        const existingItemIndex = newInventory.findIndex((item: HeroInventoryItem) => item.id === treasureBoxId);
        const canAddToExisting = canStack && existingItemIndex >= 0;
        const currentInventorySize = newInventory.filter(Boolean).length;
        const isInventoryFullNow = currentInventorySize >= maxSlots;

        // Якщо інвентар повний і не можна додати до існуючого — в overflow
        if (isInventoryFullNow && !canAddToExisting) {
          itemsToAdd.push({ id: itemDef.id, name: itemDef.name, type: itemDef.kind, slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: 1 } as HeroInventoryItem);
          dropMessages.push(`Дроп: ${itemDef.name} x1 → сундук переповнення`);
          actualDroppedItems.push({ id: treasureBoxId, name: itemDef.name, count: 1 });
        } else if (!isInventoryFullNow || canAddToExisting) {
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
          actualDroppedItems.push({ id: treasureBoxId, name: itemDef.name, count: itemCount });
        }
      }
    }
  }

  // Обробляємо спойли — тільки якщо моб спойлений (Auto Spoil, Bounty Hunter)
  if (!MOB_LOOT_TABLES_DISABLED && spoiled && mob.spoil && mob.spoil.length > 0) {
    // Оновлюємо розмір інвентаря після дропів
    const currentInventorySize = newInventory.filter(Boolean).length;
    const isInventoryFullNow = currentInventorySize >= maxSlots;

    mob.spoil.forEach((spoil: DropEntry) => {
      if (!rollDropEntry(spoil)) return;

      let itemCount = rollQuantity(spoil.min ?? 1, spoil.max ?? 1);
      const itemDef = itemsDB[spoil.id];

      if (spoil.kind === "equipment" && !itemDef) return;

      const premiumMultiplier = getPremiumMultiplier(hero);
      if (itemDef) {
        const resourceSlots = ["consumable", "resource", "quest"];
        if (resourceSlots.includes(itemDef.slot)) {
          itemCount = Math.round(itemCount * premiumMultiplier);
        }
      } else if (spoil.kind === "resource" || spoil.id.startsWith("l2item_")) {
        itemCount = Math.round(itemCount * premiumMultiplier);
      }

      if (itemDef) {
        const canStack = isStackableHeroItem({ id: itemDef.id, slot: itemDef.slot, kind: itemDef.kind, stackable: itemDef.stackable } as any);
        const existingItemIndex = canStack
          ? newInventory.findIndex((inv: HeroInventoryItem) => inv.id === spoil.id && !(inv as any).meta?.hasLSPassive)
          : -1;
        const canAddToExisting = canStack && existingItemIndex >= 0;

        if (isInventoryFullNow && !canAddToExisting) {
          const displayName = removeGradeFromResourceName(itemDef.name);
          itemsToAdd.push({ id: itemDef.id, name: itemDef.name, type: itemDef.kind, slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: itemCount } as HeroInventoryItem);
          dropMessages.push(`Спойл: ${displayName} x${itemCount} → сундук переповнення`);
          actualDroppedItems.push({ id: spoil.id, name: displayName, count: itemCount });
          return;
        }

        if (existingItemIndex >= 0) {
          const existingItem = newInventory[existingItemIndex];
          newInventory[existingItemIndex] = {
            ...existingItem,
            count: (existingItem.count ?? 1) + itemCount,
          };
        } else if (canStack) {
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
        } else {
          for (let i = 0; i < itemCount; i++) {
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
          }
        }

        const displayName = removeGradeFromResourceName(itemDef.name);
        dropMessages.push(`Спойл: ${displayName} x${itemCount}`);
        actualDroppedItems.push({ id: spoil.id, name: displayName, count: itemCount });
        return;
      }

      if (spoil.kind !== "resource" && !spoil.id.startsWith("l2item_")) return;

      const displayName = removeGradeFromResourceName(
        spoil.displayName ?? resourceLootDisplayName(spoil.id)
      );
      const iconPath = resolveDropIconPath(spoil);
      const syn: HeroInventoryItem = {
        id: spoil.id,
        name: displayName,
        type: "resource",
        slot: "resource",
        icon: iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`,
        description: "",
        count: itemCount,
      };
      const existingItemIndex = newInventory.findIndex((inv: HeroInventoryItem) => inv.id === spoil.id && !(inv as any).meta?.hasLSPassive);
      const canAddToExisting = existingItemIndex >= 0;

      if (isInventoryFullNow && !canAddToExisting) {
        itemsToAdd.push(syn);
        dropMessages.push(`Спойл: ${displayName} x${itemCount} → сундук переповнення`);
        actualDroppedItems.push({ id: spoil.id, name: displayName, count: itemCount });
        return;
      }

      if (existingItemIndex >= 0) {
        const existingItem = newInventory[existingItemIndex];
        newInventory[existingItemIndex] = {
          ...existingItem,
          count: (existingItem.count ?? 1) + itemCount,
        };
      } else {
        newInventory.push(syn);
      }
      dropMessages.push(`Спойл: ${displayName} x${itemCount}`);
      actualDroppedItems.push({ id: spoil.id, name: displayName, count: itemCount });
    });
  }

  // ❗ ОБРОБКА КВЕСТОВИХ ДРОПІВ
  // Перевіряємо активні квести та додаємо квестові предмети, якщо моб відповідає
  const activeQuests = mergeActiveQuestsForUi(hero.activeQuests, (hero as any)?.heroJson?.activeQuests);

  activeQuests.forEach((activeQuest) => {
    const questDef = QUESTS.find((q) => q.id === activeQuest.questId);
    if (!questDef || !questDef.questDrops) return;

    // Перевіряємо, чи цей моб має квестові дропи
    questDef.questDrops.forEach((questDrop) => {
      if (!mobMatchesQuestDropName(mob.name, questDrop.mobName)) return;
      if (
        questDrop.dropZoneIdPrefix &&
        (!battleZoneId || !String(battleZoneId).startsWith(questDrop.dropZoneIdPrefix))
      ) {
        return;
      }
      const need = getEffectiveQuestDropNeed(questDrop, activeQuest as any);
      // Перераховуємо розмір інвентаря перед кожним квестовим предметом (щоб кілька дропів підряд не переповнювали)
      const currentInventorySizeForQuests = newInventory.filter(Boolean).length;
      const isInventoryFullForQuests = currentInventorySizeForQuests >= maxSlots;

      // Перевіряємо інвентар для поточного прогресу
      const inventoryItem = newInventory.find((item: HeroInventoryItem) => item.id === questDrop.itemId);
      const currentItemCount = inventoryItem?.count || 0;
      const currentProgress = Math.min(currentItemCount, need);

      // Перевіряємо, чи ще потрібно збирати цей предмет
      if (currentProgress < need) {
        // Перевіряємо, чи інвентар не повний (квестові предмети стакаються з звичайними слотами)
        const existingItemIndex = newInventory.findIndex((inv: HeroInventoryItem) => inv.id === questDrop.itemId && !(inv as any).meta?.hasLSPassive);
        const canAddToExisting = existingItemIndex >= 0;

        // Якщо інвентар повний і не можна додати до існуючого — в overflow
        if (isInventoryFullForQuests && !canAddToExisting) {
          const itemDef = itemsDB[questDrop.itemId];
          if (itemDef) {
            itemsToAdd.push({ id: itemDef.id, name: itemDef.name, type: itemDef.kind, slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: 1 } as HeroInventoryItem);
            dropMessages.push(`Квест: ${itemDef.name} x1 → сундук переповнення`);
            questProgressUpdates.push({ questId: activeQuest.questId, itemId: questDrop.itemId, count: 1 });
          }
          return;
        }

        // Шанс дропу квестового предмета (100%)
        if (Math.random() < 1.0) {
          const itemDef = itemsDB[questDrop.itemId];
          if (itemDef) {
            // Шукаємо, чи вже є такий предмет в інвентарі (не стакати з камнями з ЛС)
            const existingItemIndex2 = newInventory.findIndex((inv: HeroInventoryItem) => inv.id === questDrop.itemId && !(inv as any).meta?.hasLSPassive);

            if (existingItemIndex2 >= 0) {
              // Якщо предмет вже є, збільшуємо кількість
              const existingItem = newInventory[existingItemIndex2];
              const newCount = (existingItem.count ?? 1) + 1;
              newInventory[existingItemIndex2] = {
                ...existingItem,
                count: newCount,
              };

              // Формат: Квест: Назва x1 5(15)
              const displayProgress = Math.min(newCount, need);
              dropMessages.push(`Квест: ${itemDef.name} x1 ${displayProgress}(${need})`);
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
              dropMessages.push(`Квест: ${itemDef.name} x1 1(${need})`);
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
    });
  });

  // ❗ Зарич — обробляється сервером у /battle-finish (auto-equip + 1% roll).
  // Клієнт НЕ робить roll; стан zariche приходить у відповіді battleFinishAPI.
  const zaricheEquipped = false;
  const zaricheEquippedUntil: number | undefined = undefined;
  const newEquipment: Record<string, string | null> | undefined = undefined;
  const newEquipmentEnchantLevels: Record<string, number> | undefined = undefined;

  // Медальки 7 Печатей: 5% шанс, понеділок–субота (Europe/Warsaw); неділя — без дропу
  if (isSevenSealsFarmWindowActive() && Math.random() < 0.05) {
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

  // Книги гільдії магів (тільки для містиків, макс. 1 за кілл, з відповідних мобів).
  const mysticBook = rollMysticSpellbookDropForMobKill(mob, hero);
  if (mysticBook) {
    const it = mysticBook.item;
    const existingSpellbook = newInventory.findIndex((x: HeroInventoryItem) => x.id === it.id);
    if (existingSpellbook >= 0) {
      const ex = newInventory[existingSpellbook];
      newInventory[existingSpellbook] = {
        ...ex,
        count: (ex.count ?? 1) + 1,
      };
    } else if (!isInventoryFull) {
      newInventory.push({ ...it, count: it.count ?? 1 });
    } else {
      itemsToAdd.push({ ...it, count: it.count ?? 1 });
    }
    dropMessages.push(mysticBook.message);
    actualDroppedItems.push({ id: it.id, name: it.name, count: 1 });
  }

  let finalInventory = newInventory;
  let finalOverflow = hero.overflowChest ?? [];
  if (itemsToAdd.length > 0) {
    const heroForOverflow = { ...hero, inventory: newInventory, overflowChest: finalOverflow };
    const result = addItemsWithOverflow(heroForOverflow, itemsToAdd);
    finalInventory = result.inventory;
    finalOverflow = result.overflowChest;
  }

  return {
    newInventory: finalInventory,
    dropMessages,
    adenaFromDrops,
    questProgressUpdates: questProgressUpdates.length > 0 ? questProgressUpdates : undefined,
    zaricheEquipped,
    zaricheEquippedUntil,
    newEquipment,
    newEquipmentEnchantLevels,
    actualDroppedItems,
    overflowChest: finalOverflow,
  };
}

