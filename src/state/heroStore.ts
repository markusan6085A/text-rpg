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

// 🔥 КРИТИЧНО: Серверний стан для синхронізації exp/level
// Замість глобальних змінних та window - зберігаємо в store
export interface ServerState {
  exp: number;
  level: number;
  heroRevision?: number;
  updatedAt: number; // Timestamp останнього оновлення
}

interface HeroState {
  hero: Hero | null;
  serverState: ServerState | null; // 🔥 Серверний стан для clamp

  setHero: (h: Hero) => void;

  loadHero: () => void;

  updateHero: (partial: Partial<Hero>) => void;
  
  // 🔥 Оновлюємо серверний стан після GET/PATCH
  updateServerState: (state: Partial<ServerState>) => void;

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
  serverState: null, // 🔥 Серверний стан для синхронізації

  setHero: (h) => {
    if (!h) {
      console.warn('[heroStore] setHero called with NULL hero!');
      set({ hero: null });
      return;
    }

    // 🔥 КРИТИЧНО: Захист від не-героївських payload (наприклад, клан з /my endpoint)
    // Перевіряємо, чи це дійсно hero об'єкт, а не клан або інший об'єкт
    // 🔥 ВАЖЛИВО: Guard має бути "менш строгим" - приймати героя навіть якщо він урізаний (без heroJson/skills)
    function isHeroPayload(x: any): boolean {
      if (!x || typeof x !== 'object') return false;
      
      // Клан має специфічні поля: members (масив), memberCount, isLeader, creator, reputation
      // Герой має: name, race, klass/classId (обов'язкові базові поля)
      const hasClanFields = 
        (Array.isArray(x.members) || 
         (x.memberCount !== undefined && x.isLeader !== undefined) || 
         (x.creator !== undefined && x.reputation !== undefined));
      
      // 🔥 ВАЖЛИВО: Перевіряємо базові поля героя ПЕРШИМИ (name, race, klass/classId)
      // Це гарантує, що навіть урізаний DTO (без heroJson/skills/mobsKilled) буде прийнято
      const hasBasicHeroFields = 
        typeof x.name === 'string' && 
        typeof x.race === 'string' && 
        (typeof x.klass === 'string' || typeof x.classId === 'string');
      
      // Якщо є базові поля героя - це герой (навіть якщо немає heroJson/skills)
      if (hasBasicHeroFields) {
        // 🔥 Додаткова перевірка: якщо є кланові поля БЕЗ геройських - це клан
        // Але якщо є базові геройські поля - це герой (можливо з кланом)
        if (hasClanFields && !hasBasicHeroFields) {
          return false; // Клан без базових полів героя
        }
        return true; // Має базові поля героя - це герой
      }
      
      // Якщо немає базових полів, але є геройські поля (heroJson, skills, mobsKilled, exp, level) - це герой
      const hasHeroFields = 
        (x.heroJson !== undefined || Array.isArray(x.skills) || 
         typeof x.mobsKilled === "number" || typeof x.exp === "number" || 
         typeof x.level === "number");
      
      if (hasHeroFields) {
        return true;
      }
      
      // Якщо є кланові поля без геройських - це клан
      if (hasClanFields && !hasHeroFields) {
        return false;
      }
      
      return false;
    }

    if (!isHeroPayload(h)) {
      console.warn('[heroStore.setHero] Rejected non-hero payload (likely clan object from /my endpoint):', {
        hasMembers: Array.isArray((h as any).members),
        hasEmblem: (h as any).emblem !== undefined,
        hasIsLeader: (h as any).isLeader !== undefined,
        hasMemberCount: (h as any).memberCount !== undefined,
        hasHeroJson: (h as any).heroJson !== undefined,
        hasSkills: Array.isArray((h as any).skills),
        hasMobsKilled: typeof (h as any).mobsKilled === 'number',
        name: (h as any).name,
      });
      return; // Не оновлюємо heroStore не-героївськими даними
    }

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
    
    // 🔥 КРИТИЧНО: mobsKilled, skills - критичні зміни, зберігаємо одразу
    const isCriticalChange = (partial as any).mobsKilled !== undefined || 
                             partial.skills !== undefined ||
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

  // 🔥 Оновлюємо серверний стан після GET/PATCH
  updateServerState: (state) => {
    const current = get().serverState;
    set({
      serverState: {
        exp: state.exp ?? current?.exp ?? 0,
        level: state.level ?? current?.level ?? 1,
        heroRevision: state.heroRevision ?? current?.heroRevision,
        updatedAt: state.updatedAt ?? current?.updatedAt ?? Date.now(),
      },
    });
    console.log('[heroStore] Server state updated:', get().serverState);
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
