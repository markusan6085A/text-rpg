// src/state/heroStore.ts
import { create } from "zustand";
import type { Hero, HeroInventoryItem } from "../types/Hero";
import { loadHero } from "./heroStore/heroLoad";
import { loadHeroFromAPI } from "./heroStore/heroLoadAPI";
import { updateHeroLogic } from "./heroStore/heroUpdate";
import { saveHeroToLocalStorage } from "./heroStore/heroPersistence";
import { hydrateHero } from "./heroStore/heroHydration";
import { learnSkillLogic } from "./heroStore/heroSkills";
import { equipItemLogic, unequipItemLogic } from "./heroStore/heroInventory";
import { itemsDB } from "../data/items/itemsDB";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";

export const INVENTORY_MAX_ITEMS = 100;

interface HeroState {
  hero: Hero | null;

  setHero: (h: Hero) => void;

  loadHero: () => void;

  updateHero: (partial: Partial<Hero>) => void;

  setStatus: (value: string) => void;

  learnSkill: (skillId: number) => void;

  equipItem: (item: HeroInventoryItem) => void;

  unequipItem: (slot: string) => void;

  updateAdena: (amount: number) => void;

  addItemToInventory: (itemId: string, count?: number) => void;
}

// 🔥 Debouncing для збереження - щоб уникнути rate limiting
let saveTimeout: NodeJS.Timeout | null = null;
let pendingSave: Hero | null = null;
const SAVE_DEBOUNCE_MS = 2000; // Зберігаємо через 2 секунди після останнього оновлення

function debouncedSave(hero: Hero) {
  pendingSave = hero;
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    if (pendingSave) {
      saveHeroToLocalStorage(pendingSave).catch(err => {
        console.error('[heroStore] Failed to save hero:', err);
      });
      pendingSave = null;
    }
    saveTimeout = null;
  }, SAVE_DEBOUNCE_MS);
}

// 🔥 Критичні зміни (як mobsKilled) зберігаємо одразу
function immediateSave(hero: Hero) {
  // Скасовуємо debounced save, якщо він є
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingSave = null;
  
  // Зберігаємо одразу
  saveHeroToLocalStorage(hero).catch(err => {
    console.error('[heroStore] Failed to save hero immediately:', err);
    // Якщо не вдалося - пробуємо через debounce
    debouncedSave(hero);
  });
}

export const useHeroStore = create<HeroState>((set, get) => ({
  hero: null,

  setHero: (h) => {
    if (h) {
      // 🔥 Правило 2: Використовуємо hydrateHero при встановленні hero
      const hydrated = hydrateHero(h);
      
      console.log('[heroStore] setHero called, hero exists:', {
        name: h.name,
        inventoryItems: h.inventory?.length || 0,
        skills: hydrated?.skills?.length || 0,
        profession: h.profession,
        adena: h.adena,
        mobsKilled: (hydrated as any)?.mobsKilled ?? 0,
      });
      
      set({ hero: hydrated });
    } else {
      console.warn('[heroStore] setHero called with NULL hero!');
      set({ hero: null });
    }
  },

  loadHero: () => {
    console.log('[heroStore] loadHero called (from localStorage)');
    const loadedHero = loadHero();
    console.log('[heroStore] loadHero result:', loadedHero ? 'exists' : 'null');
    set({ hero: loadedHero });
  },

  updateHero: (partial) => {
    const prev = get().hero;
    if (!prev) return;

    const updated = updateHeroLogic(prev, partial);
    
    // Логуємо зміни інвентаря для відстеження
    if (partial.inventory !== undefined) {
      console.log('[heroStore] Inventory updated:', {
        prevCount: prev.inventory?.length || 0,
        newCount: updated.inventory?.length || 0,
        items: updated.inventory?.map(i => ({ id: i.id, count: i.count })) || []
      });
    }
    
    // 🔥 КРИТИЧНО: mobsKilled - критична зміна, зберігаємо одразу
    const isCriticalChange = (partial as any).mobsKilled !== undefined || 
                             (partial as any).level !== undefined ||
                             (partial as any).exp !== undefined;
    
    set({ hero: updated });
    
    // 🔥 Критичні зміни зберігаємо одразу, інші - через debounce
    if (isCriticalChange) {
      console.log('[heroStore] Critical change detected, saving immediately');
      immediateSave(updated);
    } else {
      debouncedSave(updated);
    }
  },

  setStatus: (value) => {
    const hero = get().hero;
    if (!hero) return;
    get().updateHero({ status: value });
  },

  learnSkill: (skillId: number) => {
    const hero = get().hero;
    if (!hero) return false;

    const result = learnSkillLogic(hero, skillId);
    if (result.success && result.updatedHero) {
      get().updateHero({
        skills: result.updatedHero.skills,
        sp: result.updatedHero.sp,
      });
    }
    return result.success;
  },

  equipItem: (item: HeroInventoryItem) => {
    const hero = get().hero;
    if (!hero || !item) return;

    const updated = equipItemLogic(hero, item);
    get().updateHero({
      inventory: updated.inventory,
      equipment: updated.equipment,
      equipmentEnchantLevels: updated.equipmentEnchantLevels,
    });
  },

  unequipItem: (slot: string) => {
    const hero = get().hero;
    if (!hero || !slot) return;

    const updated = unequipItemLogic(hero, slot);
    get().updateHero({
      equipment: updated.equipment,
      inventory: updated.inventory,
    });
  },

  updateAdena: (amount: number) => {
    const hero = get().hero;
    if (!hero) return;

    const newAdena = Math.max(0, hero.adena + amount);
    get().updateHero({ adena: newAdena });
  },

  addItemToInventory: (itemId: string, count: number = 1) => {
    const hero = get().hero;
    if (!hero) {
      console.error("[addItemToInventory] Hero not found");
      return;
    }

    const itemDef = itemsDB[itemId];
    if (!itemDef) {
      console.error(`[addItemToInventory] Item not found in itemsDB: ${itemId}`);
      alert(`Помилка: предмет "${itemId}" не знайдено в базі даних!`);
      return;
    }

    // Визначаємо, чи предмет може стакатися (тільки consumable, resource, quest items)
    const stackableSlots = ["consumable", "resource", "quest"];
    const canStack = stackableSlots.includes(itemDef.slot);

    const newInventory = [...(hero.inventory || [])];
    const existingItem = newInventory.find((item) => item.id === itemId);

    if (existingItem && canStack) {
      // Тільки стакаємо, якщо предмет може стакатися
      existingItem.count = (existingItem.count || 1) + count;
    } else {
      // Якщо предмет не може стакатися або його немає в інвентарі, додаємо новий
      // Автоматично визначаємо grade та armorType, якщо вони не вказані в itemsDB
      const grade = itemDef.grade || autoDetectGrade(itemId);
      const armorType = itemDef.armorType || (itemDef.kind === "armor" || itemDef.kind === "helmet" || itemDef.kind === "boots" || itemDef.kind === "gloves" ? autoDetectArmorType(itemId) : undefined);
      
      newInventory.push({
        id: itemDef.id,
        name: itemDef.name,
        slot: itemDef.slot,
        kind: itemDef.kind,
        icon: itemDef.icon,
        description: itemDef.description,
        stats: itemDef.stats,
        count: count,
        grade: grade, // Додаємо грейд (з itemsDB або auto-detect)
        armorType: armorType, // Додаємо тип броні (з itemsDB або auto-detect)
      });
    }

    get().updateHero({ inventory: newInventory });
  },
}));
