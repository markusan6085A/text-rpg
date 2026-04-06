// src/state/heroStore.ts
import { create } from "zustand";
import type { Hero, HeroInventoryItem } from "../types/Hero";
import { loadHero } from "./heroStore/heroLoad";
import { loadHeroFromAPI } from "./heroStore/heroLoadAPI";
import { updateHeroLogic } from "./heroStore/heroUpdate";
import { saveHeroToLocalStorage, saveHeroToLocalStorageOnly } from "./heroStore/heroPersistence";
import { battleStoreRef } from "./battleStoreRef";
import { hydrateHero } from "./heroStore/heroHydration";

function syncLoadoutDeferred(prev: Hero | null, next: Hero | null) {
  if (!next?.name) return;
  void import("./battle/syncLoadoutWithHero")
    .then((m) => m.syncBattleLoadoutAfterHeroChange(prev, next))
    .catch(() => {
      /* prod: старий кеш/чанк або 404 на asset — не спамити unhandled rejection */
    });
}
import { learnSkillLogic } from "./heroStore/heroSkills";
import { equipItemLogic, unequipItemLogic } from "./heroStore/heroInventory";
import { itemsDB } from "../data/items/itemsDB";
import { showToast } from "./toastStore";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { isStackableHeroItem } from "./heroStore/inventoryOverflow";
import { maxRevisionFromConflictBody } from "../utils/revisionConflictBody";
import { getMaxResources } from "./battle/helpers/getMaxResources";

export const INVENTORY_MAX_ITEMS = 100;
export const INVENTORY_ABSOLUTE_MAX = 500;

/** Максимум слотів інвентаря для героя (базовий 100, можна збільшити до 500 за Coin of Luck). */
export function getInventoryMax(hero: { inventoryCapacity?: number } | null): number {
  if (!hero) return INVENTORY_MAX_ITEMS;
  const cap = hero.inventoryCapacity;
  if (typeof cap !== "number" || cap < INVENTORY_MAX_ITEMS) return INVENTORY_MAX_ITEMS;
  return Math.min(cap, INVENTORY_ABSOLUTE_MAX);
}

/** ID спеціального предмета «сундук переповнення» — займає останній слот. */
export const OVERFLOW_CHEST_ID = "overflow_chest";

// 🔥 КРИТИЧНО: Серверний стан для синхронізації exp/level/sp
// Замість глобальних змінних та window - зберігаємо в store
export interface ServerState {
  exp: number;
  level: number;
  sp: number; // 🔥 Додано SP для синхронізації
  /** Остання відома адена з БД (GET/realtime) — для мерджу після 409 / продажу на ринку */
  adena?: number;
  coinLuck?: number; // coinLuck з сервера; не надсилаємо PUT якщо локальне < серверного (покупка преміуму)
  heroRevision?: number;
  updatedAt: number; // Timestamp останнього оновлення
}

/** Не знижувати heroRevision: Supabase Realtime може прислати застарілий snapshot і зламати expectedRevision для PUT. */
function mergeHeroRevisionMonotonic(
  incoming: number | undefined | null,
  current: number | undefined | null
): number | undefined {
  const inc = incoming != null && Number.isFinite(Number(incoming)) ? Number(incoming) : undefined;
  const cur = current != null && Number.isFinite(Number(current)) ? Number(current) : undefined;
  if (inc === undefined && cur === undefined) return undefined;
  if (inc === undefined) return cur;
  if (cur === undefined) return inc;
  return Math.max(inc, cur);
}

interface HeroState {
  hero: Hero | null;
  serverState: ServerState | null; // 🔥 Серверний стан для clamp

  setHero: (h: Hero) => void;

  loadHero: () => void;

  updateHero: (
    partialOrUpdater: Partial<Hero> | ((prev: Hero | null) => Partial<Hero>),
    opts?: { persist?: boolean; skipServer?: boolean }
  ) => void;

  /** Оновлення героя після серверного sync (PUT/409) без запуску persistence — не викликати updateHero */
  applyServerSync: (partial: Partial<Hero>, server: Partial<ServerState>) => void;
  
  // 🔥 Оновлюємо серверний стан після GET/PATCH
  /** `revisionFromAuthoritativeGet`: після свіжого GET /characters/:id — heroRevision з відповіді замінює store (не Math.max зі старим), інакше stale client не відпускає expectedRevision. */
  updateServerState: (
    state: Partial<ServerState>,
    opts?: { revisionFromAuthoritativeGet?: boolean }
  ) => void;

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
const SAVE_DEBOUNCE_MS = 5000; // 🔥 5 с: менша затримка для не-критичних змін (було 10 с — «10 сек 1 лвл»)

// 🔥 Захист від rate limit - якщо отримали 429, не зберігаємо деякий час
let rateLimitUntil: number = 0;
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 секунд після rate limit

// 🔥 Черга критичних змін - зберігаються одразу після закінчення cooldown
let criticalSaveQueue: Hero | null = null;
let criticalSaveTimeout: NodeJS.Timeout | null = null;

// 🔥 Throttle PUT: мін. 2.5 с між API збереженнями — уникнути 429 при швидкому фармі мобів
let lastApiPutAt = 0;
const MIN_PUT_INTERVAL_MS = 2500;
export function setLastPutAt(): void {
  lastApiPutAt = Date.now();
}

// Ensure we clean up on module reload (HMR) or if we ever unmount
// 🔥 КРИТИЧНО: перед виходом (F5) завжди sync save поточного героя в localStorage
// Інакше loadHeroFromAPI перезапише store серверними даними (без lastSavedAt), і зміни відкатуються
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    if (criticalSaveTimeout) clearTimeout(criticalSaveTimeout);
    if (!resurrectInProgress) {
      try {
        // Беремо найновішу версію: pendingSave (останній scheduled) або current hero зі store
        const heroToSave = pendingSave ?? useHeroStore.getState().hero;
        if (heroToSave) {
          saveHeroToLocalStorageOnly(heroToSave);
        }
      } catch (_) {}
    }
  });
}

// 🔥 Блокуємо autosave під час виклику resurrectCharacter(), щоб старий стан не перетер новий (race condition)
let resurrectInProgress = false;
export function setResurrectInProgress(value: boolean) {
  resurrectInProgress = value;
}

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

function debouncedSave(hero: Hero, delayMs?: number) {
  if (resurrectInProgress) return;
  // 🔥 Перевіряємо, чи не в rate limit cooldown
  const now = Date.now();
  if (now < rateLimitUntil) {
    const remaining = Math.ceil((rateLimitUntil - now) / 1000);
    console.log(`[heroStore] Skipping save - rate limit cooldown active (${remaining}s remaining)`);
    return;
  }
  
  pendingSave = hero;
  const delay = delayMs ?? SAVE_DEBOUNCE_MS;
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    const toSave = pendingSave;
    if (toSave) {
      pendingSave = null;
      saveHeroToLocalStorage(toSave).catch(err => {
        console.error('[heroStore] Failed to save hero:', err);
        // 🔥 Якщо отримали rate limit - встановлюємо cooldown
        if (err?.status === 429 || (err?.message && err.message.includes('rate_limit'))) {
          rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          console.warn(`[heroStore] Rate limit detected, cooldown for ${RATE_LIMIT_COOLDOWN_MS}ms`);
        }
      });
    }
    saveTimeout = null;
  }, delay);
}

// 🔥 Критичні зміни (як mobsKilled, skills, sp) зберігаємо одразу, але з перевіркою rate limit
function immediateSave(hero: Hero) {
  if (resurrectInProgress) return;
  const now = Date.now();
  // 🔥 Throttle: якщо недавно вже славили — дебаунсимо замість миттєвого PUT (менше 429 при фармі)
  // Але спочатку синхронно пишемо в localStorage — якщо гравець F5 до таймауту, критична зміна не губиться.
  if (now - lastApiPutAt < MIN_PUT_INTERVAL_MS) {
    saveHeroToLocalStorageOnly(hero);
    debouncedSave(hero, MIN_PUT_INTERVAL_MS);
    return;
  }
  // 🔥 Перевіряємо, чи не в rate limit cooldown
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
  
  // 🔥 КРИТИЧНО: Спочатку синхронно пишемо в localStorage, щоб після F5 не втратити покупки/екіп
  saveHeroToLocalStorageOnly(hero);
  // Потім зберігаємо на API
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
    
    const prevHero = get().hero;
    set({ hero: hydrated });
    syncLoadoutDeferred(prevHero, hydrated);
    // 🔥 НЕ пишемо в localStorage з setHero — інакше один раз "старий" серверний герой перезатирає прогрес
  },

  loadHero: () => {
    console.log('[heroStore] loadHero called (from localStorage)');
    const loadedHero = loadHero();
    console.log('[heroStore] loadHero result:', loadedHero ? 'exists' : 'null');
    const prevHero = get().hero;
    set({ hero: loadedHero });
    if (loadedHero) syncLoadoutDeferred(prevHero, loadedHero);
    // 🔥 НЕ пишемо в localStorage з loadHero — запис тільки в updateHero / heroPersistence
  },

  updateHero: (partialOrUpdater, opts) => {
    const prev = get().hero;
    if (!prev) return;

    // 🔥 Functional update: дозволяє рахувати partial від актуального hero (усуває race condition у battle)
    const partial = typeof partialOrUpdater === "function"
      ? (partialOrUpdater as (prev: Hero | null) => Partial<Hero>)(prev)
      : (partialOrUpdater || {});

    // TRAP: лог + trace коли хтось виставляє hp/mp/cp в 0 (без блокування)
    const p: any = partial || {};
    const setsZero =
      (p.hp !== undefined && Number(p.hp) === 0) ||
      (p.mp !== undefined && Number(p.mp) === 0) ||
      (p.cp !== undefined && Number(p.cp) === 0);
    if (setsZero) {
      console.groupCollapsed("[TRAP updateHero] sets zero resources");
      console.log("partial:", p);
      console.trace("stack");
      console.groupEnd();
    }

    const updated = updateHeroLogic(prev, partial);
    const heroJsonPartial = (partial as any).heroJson;

    // 🔥 Реген HP/MP/CP — тільки store + localStorage, без API. Критерій: partial лише hp/mp/cp (максимум status).
    const keys = Object.keys(partial);
    const onlyRegen =
      keys.length > 0 &&
      keys.every((k) => k === "hp" || k === "mp" || k === "cp" || k === "status");

    set({ hero: updated });
    syncLoadoutDeferred(prev, updated);

    const persist = opts?.persist !== false;
    if (!persist) return;
    if (resurrectInProgress) return; // ⛔ Під час resurrect не пишемо в localStorage/API — save лише після успішної відповіді API

    saveHeroToLocalStorageOnly(updated);
    if (onlyRegen) return; // ⛔ НІЯКОГО debouncedSave/immediateSave для регену

    // Лише локально (напр. location на старті бою) — без debounce PUT, інакше через ~500ms PUT під час бою → 409.
    if (opts?.skipServer) return;

    // У бою: волатильні поля (ресурси/бойові стати/витрата зарядів/тимчасові heroBuffs)
    // не повинні робити PUT, інакше це змагається з server-authoritative /battle-finish і дає 409.
    if (opts?.persist !== true) {
      const heroJsonKeys = heroJsonPartial && typeof heroJsonPartial === "object"
        ? Object.keys(heroJsonPartial)
        : [];
      const heroJsonOnlyBuffs =
        heroJsonKeys.length > 0 &&
        heroJsonKeys.every((k) => k === "heroBuffs");
      const onlyBattleFluid =
        keys.length > 0 &&
        keys.every(
          (k) =>
            k === "hp" ||
            k === "mp" ||
            k === "cp" ||
            k === "battleStats" ||
            k === "inventory" ||
            (k === "heroJson" && heroJsonOnlyBuffs)
        );
      if (onlyBattleFluid) {
        try {
          const st = battleStoreRef.getState?.()?.status;
          // heroJson лише heroBuffs (тогл оф, диспел з екрану персонажа) треба відправляти на сервер і під час бою —
          // інакше після F5 snapshot з API знову піднімає старі бафи.
          if (st === "fighting" && !heroJsonOnlyBuffs) {
            return;
          }
        } catch {
          /* ignore */
        }
      }
    }

    // Логуємо зміни інвентаря для відстеження
    if (partial.inventory !== undefined) {
      console.log('[heroStore] Inventory updated:', {
        prevCount: prev.inventory?.length || 0,
        newCount: updated.inventory?.length || 0,
        items: updated.inventory?.map(i => ({ id: i.id, count: i.count })) || []
      });
    }

    const isResurrect = heroJsonPartial && (heroJsonPartial.isDead === false || Number(heroJsonPartial.deadAt) === 0);
    const isCriticalChange = (partial as any).mobsKilled !== undefined ||
                             partial.skills !== undefined ||
                             partial.sp !== undefined ||
                             partial.profession !== undefined ||
                             partial.inventory !== undefined ||
                             partial.equipment !== undefined ||
                             partial.equipmentEnchantLevels !== undefined ||
                             partial.adena !== undefined ||
                             (partial as any).coinOfLuck !== undefined ||
                             (partial as any).coins_silver !== undefined ||
                             (partial as any).aa !== undefined ||
                             (partial as any).level !== undefined ||
                             (partial as any).exp !== undefined ||
                             (partial as any).heroJson?.heroBuffs !== undefined ||
                             (partial as any).dailyQuestsProgress !== undefined ||
                             (partial as any).activeQuests !== undefined ||
                             isResurrect;

    if (isCriticalChange) {
      if (import.meta.env.DEV && ((partial as any).level !== undefined || (partial as any).exp !== undefined)) {
        console.log('[heroStore] immediateSave (level/exp):', { level: updated.level, exp: updated.exp });
      }
      immediateSave(updated);
    } else {
      debouncedSave(updated);
    }
  },

  applyServerSync: (partial, server) => {
    const prev = get().hero;
    if (!prev) return;
    // Після POST learn-skill / learn-additional-skill у partial приходить свіжий heroJson.skills, але hydrateHero
    // інакше лишає старий hero.skills (якщо масив непорожній) — UI не показує новий рівень. Тягнемо skills з snapshot.
    const hjPartial = (partial as any)?.heroJson;
    const effectivePartial: any =
      hjPartial && typeof hjPartial === "object" && Array.isArray(hjPartial.skills)
        ? { ...(partial as any), skills: hjPartial.skills }
        : partial;
    const merged =
      hydrateHero({ ...prev, ...effectivePartial } as any) ?? ({ ...prev, ...effectivePartial } as Hero);
    const prevLv = Number(prev.level ?? 1);
    const nextLv = Number((merged as any).level ?? prevLv);
    const prevHj = (prev as any).heroJson || {};
    const mergedHj = (merged as any).heroJson || {};
    const admMerged = Number(mergedHj.adminLevelSetAt ?? (partial as any)?.heroJson?.adminLevelSetAt ?? 0);
    const admPrev = Number(prevHj.adminLevelSetAt ?? 0);
    const adminDemoteSync = admMerged > admPrev && nextLv < prevLv;
    if (nextLv < prevLv && !adminDemoteSync) {
      (merged as any).level = prevLv;
      (merged as any).exp = prev.exp;
      if ((merged as any).heroJson && typeof (merged as any).heroJson === "object") {
        (merged as any).heroJson = {
          ...(merged as any).heroJson,
          level: prevLv,
          exp: prev.exp,
        };
      }
    }
    // Адена: Math.max(local, partial) лишає роздуту локальну адену й ламає UI після sell/shop (сервер правильний, екран не росте).
    // Якщо в snapshot є нова heroRevision > попередньої — беремо server.adena з відповіді мутації як джерело правди.
    // Якщо ревізія не виросла (запізнілий PUT з меншою аденою) — лишаємо max, щоб не відкотити новішу адену.
    const prevAdena = Number(prev.adena ?? 0);
    const partialAdena = Number((partial as any).adena ?? 0);
    const prevHeroRev = Number(prevHj.heroRevision ?? (prev as any).heroRevision ?? 0);
    const srvRevRawAdena = (server as any)?.heroRevision;
    const srvRevForAdena =
      srvRevRawAdena != null && Number.isFinite(Number(srvRevRawAdena)) ? Number(srvRevRawAdena) : NaN;
    const serverAdenaIn = (server as any)?.adena;
    const hasServerAdena = serverAdenaIn !== undefined && serverAdenaIn !== null;
    const serverAdenaNum = hasServerAdena ? Number(serverAdenaIn) : NaN;
    if (
      hasServerAdena &&
      Number.isFinite(serverAdenaNum) &&
      !Number.isNaN(serverAdenaNum) &&
      Number.isFinite(srvRevForAdena) &&
      srvRevForAdena > prevHeroRev
    ) {
      (merged as any).adena = serverAdenaNum;
      if ((merged as any).heroJson && typeof (merged as any).heroJson === "object") {
        (merged as any).heroJson = { ...(merged as any).heroJson, adena: serverAdenaNum };
      }
    } else {
      const maxAdena = Math.max(prevAdena, partialAdena);
      if (!Number.isNaN(maxAdena)) {
        (merged as any).adena = maxAdena;
      }
    }
    // Щоденні завдання: з сервера приходять у partial.heroJson (applyCharacterSnapshotFromApi). Не відкатувати
    // прогрес у prev — інакше після battle-finish UI знову показує 0.
    const pHj = (partial as any)?.heroJson;
    const serverHasDaily =
      pHj && typeof pHj === "object" && pHj.dailyQuestsProgress != null && typeof pHj.dailyQuestsProgress === "object";
    if (!serverHasDaily) {
      if ((partial as any).dailyQuestsProgress === undefined && prev.dailyQuestsProgress != null && typeof prev.dailyQuestsProgress === "object") {
        (merged as any).dailyQuestsProgress = prev.dailyQuestsProgress;
      }
      if ((partial as any).dailyQuestsCompleted === undefined && Array.isArray(prev.dailyQuestsCompleted)) {
        (merged as any).dailyQuestsCompleted = prev.dailyQuestsCompleted;
      }
      if ((partial as any).dailyQuestsResetDate === undefined && prev.dailyQuestsResetDate != null) {
        (merged as any).dailyQuestsResetDate = prev.dailyQuestsResetDate;
      }
    }
    if (!Array.isArray((merged as any).activeQuests) && Array.isArray(prev.activeQuests)) {
      (merged as any).activeQuests = prev.activeQuests;
    }
    const srvRevRaw = (server as any).heroRevision;
    if (srvRevRaw != null && Number.isFinite(Number(srvRevRaw))) {
      const r = Number(srvRevRaw);
      const hj = (merged as any).heroJson || {};
      if (Number(hj.heroRevision ?? 0) < r) {
        (merged as any).heroJson = { ...hj, heroRevision: r };
      }
      (merged as any).heroRevision = mergeHeroRevisionMonotonic(r, (merged as any).heroRevision);
    }
    let heroForStore: Hero = merged as Hero;
    if (hjPartial && typeof hjPartial === "object" && Array.isArray(hjPartial.skills)) {
      heroForStore = updateHeroLogic(merged as Hero, { skills: (merged as Hero).skills });
    }
    set({ hero: heroForStore });
    syncLoadoutDeferred(prev, heroForStore);
    const current = get().serverState;
    const nextHeroRev = mergeHeroRevisionMonotonic(server.heroRevision, current?.heroRevision);
    set({
      serverState: {
        exp: (heroForStore as any).exp ?? server.exp ?? current?.exp ?? 0,
        level: Number((heroForStore as any).level ?? server.level ?? current?.level ?? 1),
        sp: server.sp ?? current?.sp ?? 0,
        adena: (server as any).adena !== undefined ? Number((server as any).adena) : current?.adena,
        coinLuck: (server as any).coinLuck ?? current?.coinLuck,
        heroRevision: nextHeroRev,
        updatedAt: server.updatedAt ?? current?.updatedAt ?? Date.now(),
      },
    });
    if (!resurrectInProgress) {
      // Бафи: saveHeroToLocalStorageOnly мерджить heroJson.heroBuffs + loadBattle().heroBuffs — залізобетон як раніше
      saveHeroToLocalStorageOnly(heroForStore);
    }
  },

  // 🔥 Оновлюємо серверний стан після GET/PATCH
  updateServerState: (state, opts) => {
    const current = get().serverState;
    const hasIncomingRev =
      state.heroRevision !== undefined &&
      state.heroRevision !== null &&
      Number.isFinite(Number(state.heroRevision));
    const nextRev = hasIncomingRev
      ? opts?.revisionFromAuthoritativeGet
        ? Number(state.heroRevision)
        : mergeHeroRevisionMonotonic(state.heroRevision, current?.heroRevision)
      : current?.heroRevision;
    set({
      serverState: {
        exp: state.exp ?? current?.exp ?? 0,
        level: state.level ?? current?.level ?? 1,
        sp: state.sp ?? current?.sp ?? 0,
        adena: state.adena !== undefined ? Number(state.adena) : current?.adena,
        coinLuck: state.coinLuck ?? current?.coinLuck,
        heroRevision: nextRev,
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

    const result = learnSkillLogic(hero, skillId, undefined);
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
    const patch: Record<string, unknown> = {
      inventory: updated.inventory,
      equipment: updated.equipment,
      equipmentEnchantLevels: updated.equipmentEnchantLevels,
    };
    if ((updated as any).equipmentInserts !== undefined) {
      patch.equipmentInserts = (updated as any).equipmentInserts;
    }
    // Optimistic update (also triggers regular PUT via immediateSave)
    get().updateHero(patch);
    // Atomic commit to server immediately (Phase 2: ensures no multi-device rollback)
    import("../utils/api/equipAPI").then(({ commitEquipStateAPI }) => {
      const expectedRevision = Number(
        get().serverState?.heroRevision ??
        (get().hero as any)?.heroJson?.heroRevision ??
        0
      );
      const caps = getMaxResources(updated as any);
      commitEquipStateAPI({
        equipment: updated.equipment as Record<string, any>,
        inventory: updated.inventory,
        equipmentEnchantLevels: (updated.equipmentEnchantLevels ?? {}) as Record<string, number>,
        expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        baseMaxHp: caps.maxHp,
        baseMaxMp: caps.maxMp,
        baseMaxCp: caps.maxCp,
      }).then((result) => {
        if (result.ok && (result as any).character) {
          applyCharacterSnapshotFromApi((result as any).character);
        }
      }).catch(() => { /* regular PUT will still save the state */ });
    }).catch(() => {});
  },

  unequipItem: (slot: string) => {
    const hero = get().hero;
    if (!hero || !slot) return;

    const updated = unequipItemLogic(hero, slot);
    const patch: Record<string, unknown> = {
      equipment: updated.equipment,
      inventory: updated.inventory,
      equipmentEnchantLevels: updated.equipmentEnchantLevels,
    };
    if ("equipmentInserts" in updated) {
      patch.equipmentInserts = (updated as any).equipmentInserts;
    }
    // Optimistic update (also triggers regular PUT via immediateSave)
    get().updateHero(patch);
    // Atomic commit to server immediately (Phase 2)
    import("../utils/api/equipAPI").then(({ commitEquipStateAPI }) => {
      const expectedRevision = Number(
        get().serverState?.heroRevision ??
        (get().hero as any)?.heroJson?.heroRevision ??
        0
      );
      const caps = getMaxResources(updated as any);
      commitEquipStateAPI({
        equipment: updated.equipment as Record<string, any>,
        inventory: updated.inventory,
        equipmentEnchantLevels: (updated.equipmentEnchantLevels ?? {}) as Record<string, number>,
        expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        baseMaxHp: caps.maxHp,
        baseMaxMp: caps.maxMp,
        baseMaxCp: caps.maxCp,
      }).then((result) => {
        if (result.ok && (result as any).character) {
          applyCharacterSnapshotFromApi((result as any).character);
        }
      }).catch(() => {});
    }).catch(() => {});
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
      showToast(`Помилка: предмет "${itemId}" не знайдено в базі даних!`, "error");
      return;
    }

    // Визначаємо, чи предмет може стакатися — використовуємо канонічний isStackableHeroItem
    const canStack = isStackableHeroItem(itemDef as any);

    const newInventory = [...(hero.inventory || [])];
    // Не стакати з камнями з ЛС (зелені) — тільки з звичайними
    const existingItemIndex = newInventory.findIndex((item) => item.id === itemId && !(item as any).meta?.hasLSPassive);

    if (existingItemIndex >= 0 && canStack) {
      // Тільки стакаємо, якщо предмет може стакатися (змінюємо референс об'єкта для React)
      newInventory[existingItemIndex] = {
        ...newInventory[existingItemIndex],
        count: (newInventory[existingItemIndex].count || 1) + count
      };
    } else {
      // Якщо предмет не може стакатися або його немає в інвентарі, додаємо новий
      const grade = itemDef.grade || autoDetectGrade(itemId);
      const armorType = itemDef.armorType || (itemDef.kind === "armor" || itemDef.kind === "helmet" || itemDef.kind === "boots" || itemDef.kind === "gloves" ? autoDetectArmorType(itemId) : undefined);
      const baseItem = {
        id: itemDef.id,
        name: itemDef.name,
        slot: itemDef.slot,
        kind: itemDef.kind,
        icon: itemDef.icon,
        description: itemDef.description,
        stats: itemDef.stats,
        grade,
        armorType,
      };
      // stackable: false — кожен предмет окремим слотом (кристали, ЛС, камні)
      const itemsToAdd = canStack ? 1 : count;
      const countPerSlot = canStack ? count : 1;
      for (let i = 0; i < itemsToAdd; i++) {
        newInventory.push({ ...baseItem, count: countPerSlot });
      }
    }

    get().updateHero({ inventory: newInventory });
  },
}));

/**
 * Свіжа `expectedRevision` для CAS-мутацій: `serverState` має пріоритет над `heroJson.heroRevision`.
 */
export function getExpectedHeroRevisionForMutation(): number {
  const store = useHeroStore.getState();
  const raw =
    store.serverState?.heroRevision ??
    (store.hero as any)?.heroJson?.heroRevision ??
    0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Після 409 revision_conflict: вирівняти heroRevision з тілом відповіді (точка істини сервера).
 * Інакше mergeHeroRevisionMonotonic залишає «здуту» локальну ревізію — PvE start/attack постійно 409.
 */
export function applyRevisionConflictFromApiError(error: unknown): void {
  const e = error as any;
  if (e?.status !== 409) return;
  const body = e?.body;
  if (!body || typeof body !== "object") return;
  const r = maxRevisionFromConflictBody(body);
  if (r == null) return;
  const store = useHeroStore.getState();
  const h = store.hero;
  if (h && (h as any).heroJson && typeof (h as any).heroJson === "object") {
    store.updateHero(
      { heroJson: { ...(h as any).heroJson, heroRevision: r } } as Partial<Hero>,
      { skipServer: true }
    );
  }
  store.updateServerState(
    { heroRevision: r, updatedAt: Date.now() },
    { revisionFromAuthoritativeGet: true }
  );
}

export type ApplyCharacterSnapshotOptions = {
  /** Поля, що додаються до heroJson після snapshot сервера (наприклад fishingSession). */
  heroJsonExtra?: Record<string, unknown>;
  /** Якщо API не повернув nickColor (колір обрано в UI). */
  nickColorFallback?: string;
};

/**
 * Після успішної онлайн-мутації: повний `character` з відповіді API → `applyServerSync`.
 * Єдина згоджена точка входу для миттєвого UI (skills, валюта, інвентар, revision).
 */
export function applyCharacterSnapshotFromApi(character: unknown, opts?: ApplyCharacterSnapshotOptions): void {
  if (!character || typeof character !== "object") return;
  const c = character as Record<string, any>;
  const store = useHeroStore.getState();
  const currentHero = store.hero;
  if (!currentHero) return;

  const prevHj = ((currentHero as any).heroJson || {}) as Record<string, any>;
  const hasServerHeroJson = c.heroJson && typeof c.heroJson === "object";
  const serverHj = hasServerHeroJson ? ({ ...c.heroJson } as Record<string, any>) : {};
  const heroJson: Record<string, any> = {
    ...prevHj,
    ...serverHj,
    ...((opts?.heroJsonExtra || {}) as Record<string, any>),
  };
  // Після battle-finish сервер видаляє battleSession з heroJson; якщо ключа немає в snapshot,
  // spread залишив би стару сесію з prevHj → клієнт шле pve-battle-tick, сервер: no_battle_session.
  if (
    hasServerHeroJson &&
    (!Object.prototype.hasOwnProperty.call(serverHj, "battleSession") || serverHj.battleSession == null)
  ) {
    delete heroJson.battleSession;
  }

  const inventory = Array.isArray(serverHj.inventory)
    ? serverHj.inventory
    : Array.isArray(heroJson.inventory)
      ? heroJson.inventory
      : currentHero.inventory ?? [];
  const overflowChest = Array.isArray(serverHj.overflowChest)
    ? serverHj.overflowChest
    : Array.isArray(heroJson.overflowChest)
      ? heroJson.overflowChest
      : currentHero.overflowChest ?? [];
  const activeDyes = Array.isArray(serverHj.activeDyes)
    ? serverHj.activeDyes
    : Array.isArray(heroJson.activeDyes)
      ? heroJson.activeDyes
      : currentHero.activeDyes ?? [];

  heroJson.inventory = inventory;
  heroJson.overflowChest = overflowChest;
  heroJson.activeDyes = activeDyes;

  const eqFromHj =
    serverHj.equipment != null && typeof serverHj.equipment === "object"
      ? (serverHj.equipment as Record<string, unknown>)
      : null;
  const encFromHj =
    serverHj.equipmentEnchantLevels != null && typeof serverHj.equipmentEnchantLevels === "object"
      ? (serverHj.equipmentEnchantLevels as Record<string, number>)
      : null;

  const coinLuckFromServer = Number(c.coinLuck ?? currentHero.coinOfLuck ?? 0);
  const aaFromServer = Number(
    c.aa ?? c.ancientAdena ?? c.ancient_adena ?? (currentHero as any).aa ?? 0
  );
  const revision = Number(heroJson.heroRevision ?? (currentHero as any)?.heroJson?.heroRevision ?? 0);
  const level = Number(c.level ?? currentHero.level ?? 1);
  const exp = Number(c.exp ?? currentHero.exp ?? 0);
  const sp = Number(c.sp ?? currentHero.sp ?? 0);
  const adena = Number(c.adena ?? currentHero.adena ?? 0);
  const coinsSilver =
    c.coinsSilver != null
      ? Number(c.coinsSilver)
      : Number(heroJson.coins_silver ?? (currentHero as any).coins_silver ?? 0);

  const updatedAtRaw = c.updatedAt;
  const updatedAtMs =
    updatedAtRaw != null &&
    (typeof updatedAtRaw === "string" ||
      typeof updatedAtRaw === "number" ||
      updatedAtRaw instanceof Date)
      ? new Date(updatedAtRaw as string | number | Date).getTime()
      : Date.now();

  const partial: any = {
    level,
    exp,
    sp,
    adena,
    aa: Number.isFinite(aaFromServer) ? aaFromServer : Number((currentHero as any).aa ?? 0),
    coinOfLuck: coinLuckFromServer,
    coins_silver: Number.isFinite(coinsSilver) ? coinsSilver : Number((currentHero as any).coins_silver ?? 0),
    inventory,
    overflowChest,
    activeDyes,
    heroJson,
    ...(eqFromHj ? { equipment: { ...eqFromHj } as any } : {}),
    ...(encFromHj ? { equipmentEnchantLevels: { ...encFromHj } } : {}),
  };

  if (typeof c.name === "string" && c.name.trim()) {
    partial.name = c.name.trim();
    heroJson.name = partial.name;
  }

  const premRaw = c.premiumUntil ?? heroJson.premiumUntil;
  if (premRaw != null && premRaw !== "") {
    const p = Number(premRaw);
    if (Number.isFinite(p)) {
      partial.premiumUntil = p > 0 ? p : undefined;
      heroJson.premiumUntil = p > 0 ? p : 0;
    }
  }

  const nickFromChar = c.nickColor != null ? String(c.nickColor).trim() : "";
  const nickFromHj =
    heroJson.nickColor != null && heroJson.nickColor !== ""
      ? String(heroJson.nickColor).trim()
      : "";
  const nickFb = opts?.nickColorFallback != null ? String(opts.nickColorFallback).trim() : "";
  const nextNick = nickFromChar || nickFromHj || nickFb;
  if (nextNick) {
    partial.nickColor = nextNick;
    heroJson.nickColor = nextNick;
  }

  for (const [key, fromChar] of [
    ["baseMaxHp", c.baseMaxHp],
    ["baseMaxMp", c.baseMaxMp],
    ["baseMaxCp", c.baseMaxCp],
  ] as const) {
    if (fromChar == null) continue;
    const v = Math.floor(Number(fromChar));
    if (!Number.isFinite(v) || v < 1) continue;
    (partial as any)[key] = v;
    heroJson[key] = v;
  }

  const drSnap = heroJson.displayResources;
  if (drSnap && typeof drSnap === "object") {
    const h = Number(drSnap.hp);
    const m = Number(drSnap.mp);
    const cpv = Number(drSnap.cp);
    if (Number.isFinite(h) && h >= 0) partial.hp = h;
    if (Number.isFinite(m) && m >= 0) partial.mp = m;
    if (Number.isFinite(cpv) && cpv >= 0) partial.cp = cpv;
  }

  store.applyServerSync(partial, {
    level,
    exp,
    sp,
    adena,
    coinLuck: coinLuckFromServer,
    heroRevision: Number.isFinite(revision) ? revision : 0,
    updatedAt: Number.isFinite(updatedAtMs) ? updatedAtMs : Date.now(),
  });
}

/** Коли API повертає лише оновлений heroJson (legacy), будуємо мінімальний character з поточного героя. */
export function applyHeroJsonSnapshotFromApi(serverHeroJson: unknown): void {
  const h = useHeroStore.getState().hero;
  if (!h || !serverHeroJson || typeof serverHeroJson !== "object") return;
  applyCharacterSnapshotFromApi({
    level: h.level,
    exp: h.exp,
    sp: h.sp,
    adena: h.adena,
    coinLuck: (h as any).coinOfLuck,
    aa: (h as any).aa,
    coinsSilver: (h as any).coins_silver,
    name: h.name,
    heroJson: serverHeroJson,
  } as any);
}
