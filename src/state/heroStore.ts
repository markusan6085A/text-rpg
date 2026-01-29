// src/state/heroStore.ts
import { create } from "zustand";
import type { Hero, HeroInventoryItem } from "../types/Hero";
import { loadHero } from "./heroStore/heroLoad";
import { loadHeroFromAPI } from "./heroStore/heroLoadAPI";
import { updateHeroLogic } from "./heroStore/heroUpdate";
import { saveHeroToLocalStorage, saveHeroToLocalStorageOnly } from "./heroStore/heroPersistence";
import { hydrateHero } from "./heroStore/heroHydration";
import { learnSkillLogic } from "./heroStore/heroSkills";
import { equipItemLogic, unequipItemLogic } from "./heroStore/heroInventory";
import { itemsDB } from "../data/items/itemsDB";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";

export const INVENTORY_MAX_ITEMS = 100;

// 🔥 КРИТИЧНО: Серверний стан для синхронізації exp/level/sp
// Замість глобальних змінних та window - зберігаємо в store
export interface ServerState {
  exp: number;
  level: number;
  sp: number; // 🔥 Додано SP для синхронізації
  heroRevision?: number;
  updatedAt: number; // Timestamp останнього оновлення
}

interface HeroState {
  hero: Hero | null;
  serverState: ServerState | null; // 🔥 Серверний стан для clamp

  setHero: (h: Hero) => void;

  loadHero: () => void;

  updateHero: (partial: Partial<Hero>, opts?: { persist?: boolean }) => void;

  /** Оновлення героя після серверного sync (PUT/409) без запуску persistence — не викликати updateHero */
  applyServerSync: (partial: Partial<Hero>, server: Partial<ServerState>) => void;
  
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
const SAVE_DEBOUNCE_MS = 10000; // 🔥 ЗБІЛЬШЕНО: Зберігаємо через 10 секунд після останнього оновлення (було 2 секунди)

// 🔥 Захист від rate limit - якщо отримали 429, не зберігаємо деякий час
let rateLimitUntil: number = 0;
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 секунд після rate limit

// 🔥 Черга критичних змін - зберігаються одразу після закінчення cooldown
let criticalSaveQueue: Hero | null = null;
let criticalSaveTimeout: NodeJS.Timeout | null = null;

// 🔥 Експортуємо функцію для встановлення rate limit cooldown (використовується в heroPersistence)
export function setRateLimitCooldown(durationMs: number = RATE_LIMIT_COOLDOWN_MS) {
  rateLimitUntil = Date.now() + durationMs;
  console.warn(`[heroStore] Rate limit cooldown set for ${durationMs}ms`);
  
  // 🔥 Якщо є критична зміна в черзі - плануємо збереження після cooldown
  if (criticalSaveQueue) {
    scheduleCriticalSaveAfterCooldown();
  }
}

// 🔥 Скільки ще мс до кінця cooldown (0 якщо не активний). Layout/heartbeat пропускають запити поки > 0
export function getRateLimitRemainingMs(): number {
  const now = Date.now();
  return rateLimitUntil > now ? rateLimitUntil - now : 0;
}

// 🔥 Плануємо збереження критичної зміни після закінчення cooldown
function scheduleCriticalSaveAfterCooldown() {
  if (criticalSaveTimeout) {
    clearTimeout(criticalSaveTimeout);
  }
  
  const now = Date.now();
  const remaining = Math.max(0, rateLimitUntil - now);
  
  if (remaining > 0) {
    console.log(`[heroStore] Scheduling critical save after ${Math.ceil(remaining / 1000)}s cooldown`);
    criticalSaveTimeout = setTimeout(() => {
      if (criticalSaveQueue) {
        const heroToSave = criticalSaveQueue;
        criticalSaveQueue = null;
        criticalSaveTimeout = null;
        console.log('[heroStore] Executing queued critical save after cooldown');
        immediateSave(heroToSave);
      }
    }, remaining + 100); // +100ms для гарантії, що cooldown точно закінчився
  } else {
    // Cooldown вже закінчився - зберігаємо одразу
    if (criticalSaveQueue) {
      const heroToSave = criticalSaveQueue;
      criticalSaveQueue = null;
      immediateSave(heroToSave);
    }
  }
}

function debouncedSave(hero: Hero) {
  // 🔥 Перевіряємо, чи не в rate limit cooldown
  const now = Date.now();
  if (now < rateLimitUntil) {
    const remaining = Math.ceil((rateLimitUntil - now) / 1000);
    console.log(`[heroStore] Skipping save - rate limit cooldown active (${remaining}s remaining)`);
    return;
  }
  
  pendingSave = hero;
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    if (pendingSave) {
      saveHeroToLocalStorage(pendingSave).catch(err => {
        console.error('[heroStore] Failed to save hero:', err);
        // 🔥 Якщо отримали rate limit - встановлюємо cooldown
        if (err?.status === 429 || (err?.message && err.message.includes('rate_limit'))) {
          rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          console.warn(`[heroStore] Rate limit detected, cooldown for ${RATE_LIMIT_COOLDOWN_MS}ms`);
        }
      });
      pendingSave = null;
    }
    saveTimeout = null;
  }, SAVE_DEBOUNCE_MS);
}

// 🔥 Критичні зміни (як mobsKilled, skills, sp) зберігаємо одразу, але з перевіркою rate limit
function immediateSave(hero: Hero) {
  // 🔥 Перевіряємо, чи не в rate limit cooldown
  const now = Date.now();
  if (now < rateLimitUntil) {
    const remaining = Math.ceil((rateLimitUntil - now) / 1000);
    console.log(`[heroStore] Critical save blocked by rate limit cooldown (${remaining}s remaining), queuing for after cooldown`);
    // 🔥 КРИТИЧНО: Додаємо в чергу критичних змін - вони мають зберегтися одразу після cooldown
    criticalSaveQueue = hero; // Завжди беремо найновішу версію
    scheduleCriticalSaveAfterCooldown();
    // 🔥 КРИТИЧНО: Зберігаємо в localStorage одразу, щоб після F5 не втратити level/exp
    saveHeroToLocalStorageOnly(hero);
    return;
  }
  
  // Скасовуємо debounced save, якщо він є
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingSave = null;
  
  // Очищаємо чергу критичних змін, бо зберігаємо зараз
  criticalSaveQueue = null;
  if (criticalSaveTimeout) {
    clearTimeout(criticalSaveTimeout);
    criticalSaveTimeout = null;
  }
  
  // Зберігаємо одразу
  saveHeroToLocalStorage(hero).catch(err => {
    console.error('[heroStore] Failed to save hero immediately:', err);
    // 🔥 Якщо отримали rate limit - встановлюємо cooldown
    if (err?.status === 429 || (err?.message && err.message.includes('rate_limit'))) {
      rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      console.warn(`[heroStore] Rate limit detected, cooldown for ${RATE_LIMIT_COOLDOWN_MS}ms`);
      // 🔥 Додаємо в чергу критичних змін для повторної спроби після cooldown
      criticalSaveQueue = hero;
      scheduleCriticalSaveAfterCooldown();
    } else {
      // Якщо не rate limit - пробуємо через debounce
      debouncedSave(hero);
    }
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
    // 🔥 НЕ пишемо в localStorage з setHero — інакше один раз "старий" серверний герой перезатирає прогрес
  },

  loadHero: () => {
    console.log('[heroStore] loadHero called (from localStorage)');
    const loadedHero = loadHero();
    console.log('[heroStore] loadHero result:', loadedHero ? 'exists' : 'null');
    set({ hero: loadedHero });
    // 🔥 НЕ пишемо в localStorage з loadHero — запис тільки в updateHero / heroPersistence
  },

  updateHero: (partial, opts) => {
    const prev = get().hero;
    if (!prev) return;

    const updated = updateHeroLogic(prev, partial);

    // 🔥 Реген HP/MP/CP — тільки store + localStorage, без API. Критерій: partial лише hp/mp/cp (максимум status).
    const keys = Object.keys(partial);
    const onlyRegen =
      keys.length > 0 &&
      keys.every((k) => k === "hp" || k === "mp" || k === "cp" || k === "status");

    set({ hero: updated });

    const persist = opts?.persist !== false;
    if (!persist) return;

    saveHeroToLocalStorageOnly(updated);
    if (onlyRegen) return; // ⛔ НІЯКОГО debouncedSave/immediateSave для регену

    // Логуємо зміни інвентаря для відстеження
    if (partial.inventory !== undefined) {
      console.log('[heroStore] Inventory updated:', {
        prevCount: prev.inventory?.length || 0,
        newCount: updated.inventory?.length || 0,
        items: updated.inventory?.map(i => ({ id: i.id, count: i.count })) || []
      });
    }

    const isCriticalChange = (partial as any).mobsKilled !== undefined ||
                             partial.skills !== undefined ||
                             partial.sp !== undefined ||
                             partial.profession !== undefined ||
                             partial.inventory !== undefined ||
                             partial.equipment !== undefined ||
                             partial.adena !== undefined ||
                             (partial as any).coinOfLuck !== undefined ||
                             (partial as any).aa !== undefined ||
                             (partial as any).level !== undefined ||
                             (partial as any).exp !== undefined ||
                             (partial as any).heroJson?.heroBuffs !== undefined;

    if (isCriticalChange) {
      console.log('[heroStore] Critical change detected, saving immediately');
      immediateSave(updated);
    } else {
      debouncedSave(updated);
    }
  },

  applyServerSync: (partial, server) => {
    const prev = get().hero;
    if (!prev) return;
    const merged = hydrateHero({ ...prev, ...partial } as any) ?? ({ ...prev, ...partial } as Hero);
    set({ hero: merged });
    const current = get().serverState;
    set({
      serverState: {
        exp: server.exp ?? current?.exp ?? 0,
        level: server.level ?? current?.level ?? 1,
        sp: server.sp ?? current?.sp ?? 0,
        heroRevision: server.heroRevision ?? current?.heroRevision,
        updatedAt: server.updatedAt ?? current?.updatedAt ?? Date.now(),
      },
    });
    // Бафи: saveHeroToLocalStorageOnly мерджить heroJson.heroBuffs + loadBattle().heroBuffs — залізобетон як раніше
    saveHeroToLocalStorageOnly(merged);
  },

  // 🔥 Оновлюємо серверний стан після GET/PATCH
  updateServerState: (state) => {
    const current = get().serverState;
    set({
      serverState: {
        exp: state.exp ?? current?.exp ?? 0,
        level: state.level ?? current?.level ?? 1,
        sp: state.sp ?? current?.sp ?? 0, // 🔥 Додано SP
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
