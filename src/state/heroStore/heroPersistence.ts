/**
 * heroPersistence — ЄДИНЕ МІСЦЕ ЗАПИСУ героя в localStorage (l2_accounts_v2).
 *
 * ЗАЛІЗОБЕТОН:
 * - localStorage = миттєвий snapshot: saveHeroToLocalStorageOnly() викликається СИНХРОННО з heroStore
 *   при КОЖНІЙ зміні hero (setHero, loadHero, updateHero). Без debounce, без очікування API.
 * - API = "доставимо коли зможемо": saveHeroToLocalStorage() — async, debounce/queue/rate limit.
 *
 * Читання з localStorage — тільки heroLoad (loadHero()). Запис snapshot — переважно тут.
 * Bootstrap (логін / реєстрація): `syncCurrentUserAndAccountHero` — єдине місце для `l2_current_user` + рядка в `l2_accounts_v2`.
 */
import type { Hero } from "../../types/Hero";
import { updateCharacter, getCharacter, updateInventoryAPI } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { getJSON, setJSON } from "../persistence"; // Fallback for localStorage
import { loadBattle } from "../battle/persist";
import { loadLoadout } from "../battle/loadout";
import { loadWarehouse, seedWarehouseFromHeroJsonIfStorageEmpty } from "../warehouse/warehousePersistence";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import { hydrateHero } from "./heroHydration";

/** Логін / реєстрація / після GET героя: `l2_current_user` і запис `{ username, hero }` у `l2_accounts_v2`. Якщо `hero` не передано — лише встановлює поточного користувача (наприклад перед loadHeroFromAPI). */
export function syncCurrentUserAndAccountHero(username: string, hero?: Hero): void {
  const u = String(username ?? "").trim();
  if (!u) return;
  setJSON("l2_current_user", u);
  if (!hero) return;
  const raw = getJSON<any[]>("l2_accounts_v2", []);
  const accounts = Array.isArray(raw) ? [...raw] : [];
  const idx = accounts.findIndex((a: any) => a && a.username === u);
  if (idx === -1) accounts.push({ username: u, hero });
  else accounts[idx] = { ...accounts[idx], username: u, hero };
  setJSON("l2_accounts_v2", accounts);
}

// 🔥 КРИТИЧНО: Глобальний "save mutex" для серіалізації збережень
// Запобігає паралельним збереженням, які викликають revision_conflict
let saving = false;
let queuedHero: Hero | null = null; // Snapshot героя для відкладених збережень (не boolean!)
let retryCount = 0;
const MAX_RETRIES = 1; // Один GET+merge після 409; ревізія з тіла відповіді підтягується в applyHeroRevisionFrom409Body

/** PUT 409 повертає актуальний serverState.heroRevision; без цього наступний expectedRevision знову відстає (battle/heartbeat/state). */
async function applyHeroRevisionFrom409Body(error: any): Promise<void> {
  if (error?.status !== 409) return;
  const body = (error as any).body;
  if (!body || typeof body !== "object") return;
  const srvRev =
    body.serverState?.heroRevision ??
    body.heroRevision ??
    (error as any).details?.serverState?.heroRevision;
  if (srvRev == null || !Number.isFinite(Number(srvRev))) return;
  const r = Number(srvRev);
  const { useHeroStore } = await import('../heroStore');
  useHeroStore.getState().updateServerState({
    heroRevision: r,
    updatedAt: Date.now(),
  });
}

// 🔥 ВИДАЛЕНО: Глобальні змінні lastServerExp/lastServerLevel та window.__lastServerExp
// Тепер використовуємо serverState з heroStore

/**
 * Після PUT клієнт не відправляє top-level exp/level/sp (api.ts їх прибирає) — оновлюється heroJson,
 * а колонки Character.exp/level/sp у відповіді можуть лишатися застарілими. Для UI і serverState
 * беремо прогрес з heroJson, якщо там є валідні числа.
 */
export function readCharacterProgress(character: any): { level: number; exp: number; sp: number } {
  const hj = (character?.heroJson ?? {}) as any;
  const levelCol = Math.max(1, Number(character?.level ?? 1) || 1);
  const expCol = Math.max(0, Number(character?.exp ?? 0) || 0);
  const spCol = Math.max(0, Number(character?.sp ?? 0) || 0);
  const lj = hj.level != null && hj.level !== "" ? Number(hj.level) : NaN;
  const ej = hj.exp != null && hj.exp !== "" ? Number(hj.exp) : NaN;
  const sj = hj.sp != null && hj.sp !== "" ? Number(hj.sp) : NaN;
  const spFromHj = Number.isFinite(sj) && sj >= 0 ? sj : null;
  // SP: max(json, колонка) — PUT раніше не оновлював колонку; після виправлення обидва джерела узгоджуються
  const sp = spFromHj !== null ? Math.max(spFromHj, spCol) : spCol;
  return {
    level: Number.isFinite(lj) && lj > 0 ? lj : levelCol,
    exp: Number.isFinite(ej) && ej >= 0 ? ej : expCol,
    sp,
  };
}

// 🔥 КРИТИЧНО: У всіх backup у localStorage heroJson має містити exp/level/sp/skills/mobsKilled/adena
// щоб при local-first / порівнянні не було відкату через старі значення
function buildBackupHeroJson(hero: Hero): Record<string, unknown> {
  const mobsKilled = (hero as any).mobsKilled ?? (hero as any).mobs_killed ?? (hero as any).killedMobs ?? (hero as any).totalKills ?? 0;
  const inventoryCapacity = typeof (hero as any).inventoryCapacity === "number" && (hero as any).inventoryCapacity >= 100 ? (hero as any).inventoryCapacity : undefined;
  return {
    exp: hero.exp ?? 0,
    level: hero.level ?? 1,
    sp: hero.sp ?? 0,
    adena: hero.adena ?? (hero as any).heroJson?.adena ?? 0,
    coinOfLuck: hero.coinOfLuck ?? 0,
    premiumUntil: hero.premiumUntil ?? (hero as any).heroJson?.premiumUntil,
    skills: Array.isArray(hero.skills) ? hero.skills : [],
    mobsKilled,
    equipment: hero.equipment && typeof hero.equipment === 'object' ? hero.equipment : {},
    ...(hero.equipmentInserts && Object.keys(hero.equipmentInserts).length > 0 ? { equipmentInserts: hero.equipmentInserts } : {}),
    activeDyes: Array.isArray(hero.activeDyes) ? hero.activeDyes : [],
    activeQuests: Array.isArray(hero.activeQuests) ? hero.activeQuests : [],
    ...(inventoryCapacity !== undefined ? { inventoryCapacity } : {}),
    overflowChest: Array.isArray(hero.overflowChest) ? hero.overflowChest : [],
    battleLoadoutSlots: loadLoadout(hero.name),
    ...(() => {
      const widRaw = (hero as any).id;
      const wid = typeof widRaw === "string" && String(widRaw).trim().length > 0 ? String(widRaw).trim() : "";
      if (!wid) return {};
      return { warehouseSlots: loadWarehouse(wid, hero.name) };
    })(),
  };
}

// 🔥 Залізобетон: СИНХРОННИЙ запис у localStorage — миттєвий snapshot при кожній зміні hero в store.
// Викликається з heroStore (setHero, loadHero, updateHero). Без API, без debounce.
export function saveHeroToLocalStorageOnly(hero: Hero): void {
  if (!hero || !hero.name) return;
  const hydrated = hydrateHero(hero);
  if (!hydrated) return;
  const current = getJSON<string | null>("l2_current_user", null);
  if (!current) return;
  const accounts = getJSON<any[]>("l2_accounts_v2", []);
  let accIndex = accounts.findIndex((a: any) => a.username === current);
  if (accIndex === -1) {
    accounts.push({ username: current, hero: {} });
    accIndex = accounts.length - 1;
  }
  // 🔥 КРИТИЧНО: isDead/deadAt тільки з поточного героя — не з попереднього snapshot; після оживлення смерть не "липне" в localStorage
  const currentJson = (hero as any).heroJson ?? {};
  const battleState = loadBattle(hydrated.name);
  const battleBuffs = Array.isArray(battleState?.heroBuffs) ? battleState.heroBuffs : [];
  const jsonBuffs = Array.isArray(currentJson.heroBuffs) ? currentJson.heroBuffs : [];
  // Спочатку battle — актуальний список з бою (toggle off, диспел); інакше застарілий запис у json перекривав би snapshot
  const mergedBuffs = [...battleBuffs, ...jsonBuffs].filter((b: any, i: number, arr: any[]) =>
    arr.findIndex((x: any) => (x.id && b.id && x.id === b.id) || (!x.id && !b.id && x.name === b.name)) === i
  );
  const wasFullHp = Number(hydrated.hp ?? 0) >= Number(hydrated.maxHp ?? 1);
  const wasFullMp = Number(hydrated.mp ?? 0) >= Number(hydrated.maxMp ?? 1);
  const wasFullCp = Number(hydrated.cp ?? 0) >= Number(hydrated.maxCp ?? 1);
  // 🔥 КРИТИЧНО: inventory завжди з hero (не з currentJson) — інакше після «Очистить» heroJson.inventory лишається старим
  const inventoryToSave = Array.isArray(hydrated.inventory) ? hydrated.inventory : (Array.isArray(currentJson.inventory) ? currentJson.inventory : []);
  const heroJson = {
    ...currentJson,
    ...buildBackupHeroJson(hydrated),
    inventory: inventoryToSave,
    hp: Number(hydrated.hp ?? 0),
    mp: Number(hydrated.mp ?? 0),
    cp: Number(hydrated.cp ?? 0),
    maxHp: Number(hydrated.maxHp ?? 1),
    maxMp: Number(hydrated.maxMp ?? 1),
    maxCp: Number(hydrated.maxCp ?? 1),
    isDead: Boolean(currentJson.isDead),
    deadAt: Number(currentJson.deadAt) || 0,
    heroBuffs: mergedBuffs.length ? mergedBuffs : (currentJson.heroBuffs ?? []),
    hpFull: wasFullHp,
    mpFull: wasFullMp,
    cpFull: wasFullCp,
    hpPercent: Math.max(0, Math.min(1, Number(hydrated.maxHp ?? 1) > 0 ? Number(hydrated.hp ?? 0) / Number(hydrated.maxHp ?? 1) : 1)),
    mpPercent: Math.max(0, Math.min(1, Number(hydrated.maxMp ?? 1) > 0 ? Number(hydrated.mp ?? 0) / Number(hydrated.maxMp ?? 1) : 1)),
    cpPercent: Math.max(0, Math.min(1, Number(hydrated.maxCp ?? 1) > 0 ? Number(hydrated.cp ?? 0) / Number(hydrated.maxCp ?? 1) : 1)),
    // Щоденні завдання — завжди в heroJson при кожному sync-збереженні, щоб після F5 прогрес не гублявся
    dailyQuestsProgress: (hydrated as any).dailyQuestsProgress && typeof (hydrated as any).dailyQuestsProgress === "object" ? (hydrated as any).dailyQuestsProgress : (currentJson.dailyQuestsProgress ?? {}),
    dailyQuestsCompleted: Array.isArray((hydrated as any).dailyQuestsCompleted) ? (hydrated as any).dailyQuestsCompleted : (Array.isArray(currentJson.dailyQuestsCompleted) ? currentJson.dailyQuestsCompleted : []),
    dailyQuestsResetDate: (hydrated as any).dailyQuestsResetDate ?? currentJson.dailyQuestsResetDate ?? null,
    activeQuests: Array.isArray((hydrated as any).activeQuests) ? (hydrated as any).activeQuests : (Array.isArray(currentJson.activeQuests) ? currentJson.activeQuests : []),
  };
  const activeQuestsToStore = Array.isArray((hydrated as any).activeQuests) ? (hydrated as any).activeQuests : (Array.isArray((heroJson as any).activeQuests) ? (heroJson as any).activeQuests : []);
  // 🔥 КРИТИЧНО: lastSavedAt для loadHeroFromAPI — щоб localNewerByTimestamp спрацьовував при F5 (зміни екіпу/інвентаря)
  const now = Date.now();
  accounts[accIndex].hero = { ...hydrated, heroJson, activeQuests: activeQuestsToStore, lastSavedAt: now };
  setJSON("l2_accounts_v2", accounts);
  console.log('[saveHeroToLocalStorageOnly] Saved hero to localStorage (level:', hydrated.level, 'exp:', hydrated.exp, 'buffs:', mergedBuffs.length, 'activeQuests:', activeQuestsToStore.length, ')');
}

// Try to save via API, fallback to localStorage if not authenticated
export async function saveHeroToLocalStorage(hero: Hero): Promise<void> {
  // ❗ ВАЖЛИВО: Перевіряємо, чи hero не порожній перед збереженням
  if (!hero || !hero.name) {
    console.error('[saveHeroToLocalStorage] Attempted to save empty or invalid hero!', hero);
    return;
  }
  
  // 🔥 КРИТИЧНО: Серіалізуємо збереження - якщо вже йде save, зберігаємо snapshot героя
  if (saving) {
    console.log('[saveHeroToLocalStorage] Save already in progress, queuing hero snapshot');
    queuedHero = hero; // Останній актуальний герой (snapshot для відкладеного save)
    return;
  }
  
  // Встановлюємо флаг, що save йде
  saving = true;
  retryCount = 0;
  
  try {
    await saveHeroOnce(hero);
  } finally {
    saving = false;
    
    // 🔥 Після успішного save store має новіший heroRevision (applyServerSync). Беремо актуального героя зі store,
    // інакше snapshot з черги може мати застарілий heroJson.heroRevision → PUT з expectedRevision на 1 менше.
    if (queuedHero) {
      const snap = queuedHero;
      queuedHero = null;
      const { useHeroStore } = await import('../heroStore');
      const fresh = useHeroStore.getState().hero;
      const nextHero =
        fresh && snap?.name && fresh.name === snap.name ? fresh : snap;
      console.log('[saveHeroToLocalStorage] Processing queued save (store hero when same name)');
      
      // Clear previous timeout if exists to prevent overlapping saves
      if ((saveHeroToLocalStorage as any)._timeoutId) {
        clearTimeout((saveHeroToLocalStorage as any)._timeoutId);
      }
      
      (saveHeroToLocalStorage as any)._timeoutId = setTimeout(() => saveHeroToLocalStorage(nextHero), 500);
    }
  }
}

// Внутрішня функція для одного збереження
async function saveHeroOnce(hero: Hero): Promise<void> {
  const { useHeroStore } = await import('../heroStore');
  const live = useHeroStore.getState().hero;
  const sourceHero =
    live && hero?.name && live.name === hero.name ? live : hero;
  // 🔥 Правило 2: Використовуємо hydrateHero перед збереженням для гарантованої синхронізації
  const hydrated = hydrateHero(sourceHero);
  if (!hydrated) {
    console.error('[saveHeroToLocalStorage] Failed to hydrate hero!');
    return;
  }
  
  // Використовуємо hydrated hero для збереження
  hero = hydrated;
  
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

  // 🔥 Не спамимо сервер при протухлій сесії (401/403). Зберігаємо тільки в localStorage до re-login.
  if (!authStore.isAuthenticated || !characterStore.characterId || authStore.sessionExpired) {
    const current = getJSON<string | null>("l2_current_user", null);
    if (!current) return;

    const accounts = getJSON<any[]>("l2_accounts_v2", []);
    let accIndex = accounts.findIndex((a: any) => a.username === current);
    if (accIndex === -1) {
      accounts.push({ username: current, hero: {} });
      accIndex = accounts.length - 1;
    }
    {
      accounts[accIndex].hero = hero;
      setJSON("l2_accounts_v2", accounts);
    }
    return;
  }

  // Save via API
  try {
    // 🔥 КРИТИЧНО: Якщо вже в cooldown (429) — НЕ славимо PUT, тільки localStorage.
    // Інакше "черга збереження" (setTimeout 100ms) славить другий PUT → знову 429 → подвійний cooldown і відкати.
    const { getRateLimitRemainingMs } = await import('../heroStore');
    if (getRateLimitRemainingMs() > 0) {
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        let accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex === -1) {
          accounts.push({ username: current, hero: {} });
          accIndex = accounts.length - 1;
        }
        {
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            _rateLimitSkip: true,
            heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
          console.log('[saveHeroToLocalStorage] Cooldown active, saved to localStorage only (no PUT)');
        }
      }
      return;
    }

    console.log('[saveHeroToLocalStorage] Saving hero via API:', {
      inventoryItems: hero.inventory?.length || 0,
      skills: hero.skills?.length || 0,
      profession: hero.profession,
      adena: hero.adena,
      level: hero.level,
      hasEquipment: !!hero.equipment && Object.keys(hero.equipment).length > 0
    });
    
    // Перевіряємо, чи hero не порожній перед збереженням
    if (!hero || !hero.name) {
      console.error('[saveHeroToLocalStorage] Attempted to save empty hero!');
      return;
    }
    
    // 🔥 КРИТИЧНО: expectedRevision з serverState; fallback hero → 0 для першого sync (сервер приймає 0)
    const heroStore = useHeroStore;
    let serverState = heroStore.getState().serverState;
    // 🔥 Якщо serverState є null (наприклад, GET не пройшов при завантаженні) — робимо GET перед save,
    // щоб мати актуальні exp/level для clamp і не отримати "exp cannot be decreased"
    if (!serverState && characterStore.characterId) {
      try {
        const freshChar = await getCharacter(characterStore.characterId);
        if (freshChar) {
          const hj = (freshChar as any).heroJson || {};
          const prog = readCharacterProgress(freshChar);
          heroStore.getState().updateServerState({
            exp: prog.exp,
            level: prog.level,
            sp: prog.sp,
            adena: Number((freshChar as any).adena ?? 0),
            coinLuck: Number((freshChar as any).coinLuck ?? 0),
            heroRevision: hj.heroRevision ?? (hero as any)?.heroJson?.heroRevision ?? 0,
            updatedAt: Date.now(),
          });
          serverState = heroStore.getState().serverState;
          console.log('[saveHeroToLocalStorage] Fetched serverState before save (was null):', serverState);
        }
      } catch (e) {
        console.warn('[saveHeroToLocalStorage] Failed to fetch serverState before save:', e);
      }
    }
    let expectedRevision = serverState?.heroRevision ?? (hero as any)?.heroJson?.heroRevision ?? (hero as any)?.heroRevision ?? 0;
    if (expectedRevision === undefined || expectedRevision === null || (typeof expectedRevision === 'number' && Number.isNaN(expectedRevision))) {
      console.warn('[saveHeroToLocalStorage] No serverState.heroRevision — skipping PUT, saving to localStorage only');
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        let accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex === -1) {
          accounts.push({ username: current, hero: {} });
          accIndex = accounts.length - 1;
        }
        {
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
        }
      }
      return;
    }
    
    // 🔥 ВАЖЛИВО: mobsKilled має бути в heroJson, а не на верхньому рівні hero
    // Переконуємося, що mobsKilled зберігається в heroJson
    // Перевіряємо всі можливі місця, де може бути mobsKilled
    const currentMobsKilled = (hero as any).mobsKilled ?? 
                              (hero as any).mobs_killed ?? 
                              (hero as any).killedMobs ?? 
                              (hero as any).totalKills ?? 
                              ((hero as any).heroJson?.mobsKilled) ??
                              ((hero as any).heroJson?.mobs_killed) ??
                              ((hero as any).heroJson?.killedMobs) ??
                              ((hero as any).heroJson?.totalKills) ??
                              0;
    
    // 🔥 КРИТИЧНО: Завжди робимо MERGE з існуючим heroJson, щоб не втратити дані
    // Ніколи не перезаписуємо heroJson об'єктом, який містить тільки skills/mobsKilled/buffs
    const existingHeroJson = (hero as any).heroJson ?? {};
    const widForWarehouse = characterStore.characterId || (hero as any).id;
    if (typeof widForWarehouse === "string" && widForWarehouse.trim().length > 0) {
      seedWarehouseFromHeroJsonIfStorageEmpty(
        widForWarehouse.trim(),
        existingHeroJson.warehouseSlots,
        hero.name
      );
    }

    // Логуємо mobsKilled для діагностики (завжди, не тільки в DEV)
    console.log('[saveHeroToLocalStorage] mobsKilled to save:', currentMobsKilled, 'from hero:', {
      mobsKilled: (hero as any).mobsKilled,
      heroJsonMobsKilled: existingHeroJson.mobsKilled,
    });
    
    // 🔥 КРИТИЧНО: Бафи можуть бути в heroJson.heroBuffs або в battle state
    // Перевіряємо обидва джерела
    const savedBattle = loadBattle(hero.name);
    const battleBuffs = savedBattle?.heroBuffs || [];
    const heroJsonBuffs = Array.isArray(existingHeroJson.heroBuffs) ? existingHeroJson.heroBuffs : [];
    
    // Об'єднуємо бафи з обох джерел (уникаємо дублікатів за id)
    const allBuffs = [...heroJsonBuffs, ...battleBuffs];
    const uniqueBuffs = allBuffs.filter((buff: any, index: number, self: any[]) => 
      index === self.findIndex((b: any) => 
        (b.id && buff.id && b.id === buff.id) || 
        (!b.id && !buff.id && b.name === buff.name)
      )
    );
    
    // 🔥 КРИТИЧНО: Гарантуємо обов'язкові поля для сервера (name, race, classId/klass)
    // Беремо з існуючого heroJson або з hero, але завжди маємо значення (і вони мають бути строками!)
    const requiredName = String(existingHeroJson.name ?? hero.name ?? "");
    const requiredRace = String(existingHeroJson.race ?? hero.race ?? "");
    const requiredClassId = String(existingHeroJson.classId ?? (hero as any).classId ?? hero.klass ?? "");
    const requiredKlass = String(existingHeroJson.klass ?? hero.klass ?? "");
    
    // 🔥 КРИТИЧНО: Перевіряємо, що обов'язкові поля не порожні
    if (!requiredName || !requiredRace || (!requiredClassId && !requiredKlass)) {
      console.error('[saveHeroToLocalStorage] CRITICAL: Missing required fields in hero!', {
        name: requiredName,
        race: requiredRace,
        classId: requiredClassId,
        klass: requiredKlass,
        heroName: hero.name,
        heroRace: hero.race,
        heroKlass: hero.klass,
      });
      // Не відправляємо на сервер, якщо немає обов'язкових полів
      // Зберігаємо тільки в localStorage як backup
      const current = getJSON<string | null>("l2_current_user", null);
      if (current) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        let accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex === -1) {
          accounts.push({ username: current, hero: {} });
          accIndex = accounts.length - 1;
        }
        {
          accounts[accIndex].hero = hero;
          setJSON("l2_accounts_v2", accounts);
          console.warn('[saveHeroToLocalStorage] Saved to localStorage only (missing required fields)');
        }
      }
      return;
    }
    
    // Зберігаємо HP/MP/CP як відсоток від buffed max, запис у heroJson у base-просторі — щоб F5 не "різав" HP.
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    const baseMaxHp = Math.max(1, Number((hero as any).baseMaxHp ?? existingHeroJson.maxHp ?? hero.maxHp ?? 1) || 1);
    const baseMaxMp = Math.max(1, Number((hero as any).baseMaxMp ?? existingHeroJson.maxMp ?? hero.maxMp ?? 1) || 1);
    const baseMaxCp = Math.max(1, Number((hero as any).baseMaxCp ?? existingHeroJson.maxCp ?? hero.maxCp ?? Math.max(1, Math.round(baseMaxHp * 0.6))) || 1);

    const baseMax = { maxHp: baseMaxHp, maxMp: baseMaxMp, maxCp: baseMaxCp };
    const now = Date.now();
    const activeBuffs = cleanupBuffs(uniqueBuffs, now);
    const buffedMax = computeBuffedMaxResources(baseMax, activeBuffs);
    const runtimeMaxHp = Math.max(1, buffedMax.maxHp);
    const runtimeMaxMp = Math.max(1, buffedMax.maxMp);
    const runtimeMaxCp = Math.max(1, buffedMax.maxCp);

    const safeNow = (raw: any, fallback: number) => {
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const hpNow = safeNow(hero.hp, runtimeMaxHp);
    const mpNow = safeNow(hero.mp, runtimeMaxMp);
    const cpNow = safeNow(hero.cp, runtimeMaxCp);

    const hpPercent = clamp01(runtimeMaxHp > 0 ? hpNow / runtimeMaxHp : 1);
    const mpPercent = clamp01(runtimeMaxMp > 0 ? mpNow / runtimeMaxMp : 1);
    const cpPercent = clamp01(runtimeMaxCp > 0 ? cpNow / runtimeMaxCp : 1);

    const hpToSave = Math.min(baseMaxHp, Math.max(0, Math.round(hpPercent * baseMaxHp)));
    const mpToSave = Math.min(baseMaxMp, Math.max(0, Math.round(mpPercent * baseMaxMp)));
    const cpToSave = Math.min(baseMaxCp, Math.max(0, Math.round(cpPercent * baseMaxCp)));

    const wasFullHp = hpPercent >= 1;
    const wasFullMp = mpPercent >= 1;
    const wasFullCp = cpPercent >= 1;

    if (import.meta.env.DEV) {
      console.log("[heroPersistence] save HP snapshot:", {
        baseMaxHp,
        runtimeMaxHp,
        hpNow,
        hpPercent,
        hpToSave,
        expect: Math.round(hpPercent * baseMaxHp),
        buffsCount: activeBuffs.length,
      });
    }

    // 🔥 Race-condition fix: якщо зберігаємо "старий" snapshot (напр. було "Save already in progress"),
    // поточний store може мати новіший dailyQuestsProgress (daily_kills, daily_adena_farm з перемоги).
    // Беремо максимум по кожному ключу, щоб ніколи не відправити на сервер прогрес без daily_kills/daily_adena_farm.
    const storeHero = heroStore.getState().hero;
    const progressFromHero = hero.dailyQuestsProgress && typeof hero.dailyQuestsProgress === "object" ? hero.dailyQuestsProgress : {};
    const progressFromStore = storeHero?.dailyQuestsProgress && typeof storeHero.dailyQuestsProgress === "object" ? storeHero.dailyQuestsProgress : {};
    const mergedDailyProgress: Record<string, number> = { ...(existingHeroJson.dailyQuestsProgress && typeof existingHeroJson.dailyQuestsProgress === "object" ? existingHeroJson.dailyQuestsProgress : {}) };
    new Set([...Object.keys(progressFromHero), ...Object.keys(progressFromStore)]).forEach((key) => {
      const a = Number(progressFromHero[key]) || 0;
      const b = Number(progressFromStore[key]) || 0;
      mergedDailyProgress[key] = Math.max(mergedDailyProgress[key] ?? 0, a, b);
    });
    const dailyQuestsProgressToSave = Object.keys(mergedDailyProgress).length > 0 ? mergedDailyProgress : {};

    // 🔥 MERGE: зберігаємо всі існуючі поля + оновлюємо прогрес
    // 🔥 КРИТИЧНО: isDead/deadAt не мерджимо з existingHeroJson — тільки з поточного hero.heroJson; змінюються лише в death/resurrect handlers
    const currentHeroJson = (hero as any).heroJson || {};
    const heroJsonToSave = {
      ...existingHeroJson,
      isDead: Boolean(currentHeroJson.isDead),
      deadAt: Number(currentHeroJson.deadAt) || 0,
      // 🔒 Обов'язкові поля — гарантуємо завжди (з існуючого або з hero) і завжди строки!
      name: requiredName,
      race: requiredRace,
      // Сервер приймає або classId, або klass — передаємо обидва для надійності
      classId: requiredClassId,
      klass: requiredKlass,

      // Додаткові базові поля (якщо є)
      ...(hero.gender ? { gender: String(hero.gender) } : {}),
      ...(hero.profession ? { profession: String(hero.profession) } : {}),

      // 🔥 Прогрес (оновлюємо завжди) - значення будуть обчислені нижче з clamp
      level: Number(hero.level ?? existingHeroJson.level ?? 1),
      exp: Number(hero.exp ?? existingHeroJson.exp ?? 0),
      sp: Number(hero.sp ?? existingHeroJson.sp ?? 0),
      // ✅ hp/mp/cp завжди clamp до base max — сервер не буде "різати" і F5 не відкотить
      hp: hpToSave,
      mp: mpToSave,
      cp: cpToSave,
      maxHp: baseMaxHp,
      maxMp: baseMaxMp,
      maxCp: baseMaxCp,
      hpFull: wasFullHp,
      mpFull: wasFullMp,
      cpFull: wasFullCp,
      hpPercent,
      mpPercent,
      cpPercent,
      mobsKilled: Number(currentMobsKilled),
      coinOfLuck: Number(hero.coinOfLuck ?? existingHeroJson.coinOfLuck ?? 0),
      premiumUntil: hero.premiumUntil ?? existingHeroJson.premiumUntil ?? undefined,
      skills: Array.isArray(hero.skills) ? hero.skills : (Array.isArray(existingHeroJson.skills) ? existingHeroJson.skills : []),
      heroBuffs: Array.isArray(uniqueBuffs) ? uniqueBuffs : [],

      // 🔥 КРИТИЧНО: Завжди зберігаємо inventory та equipment з hero (не лишаємо тільки з existingHeroJson)
      // Інакше стартовий набір може зникнути, якщо сервер колись повернув порожній heroJson
      inventory: Array.isArray(hero.inventory) ? hero.inventory : (Array.isArray(existingHeroJson.inventory) ? existingHeroJson.inventory : []),
      equipment: hero.equipment && typeof hero.equipment === 'object' ? hero.equipment : (existingHeroJson.equipment && typeof existingHeroJson.equipment === 'object' ? existingHeroJson.equipment : {}),
      ...(hero.equipmentEnchantLevels && Object.keys(hero.equipmentEnchantLevels).length > 0 ? { equipmentEnchantLevels: hero.equipmentEnchantLevels } : {}),
      ...(hero.equipmentInserts && Object.keys(hero.equipmentInserts).length > 0 ? { equipmentInserts: hero.equipmentInserts } : {}),
      activeDyes: Array.isArray(hero.activeDyes) && hero.activeDyes.length > 0 ? hero.activeDyes : (Array.isArray(existingHeroJson.activeDyes) ? existingHeroJson.activeDyes : []),
      // Щоденні завдання — мерджимо з store, щоб при race не губити daily_kills/daily_adena_farm
      dailyQuestsProgress: dailyQuestsProgressToSave,
      dailyQuestsCompleted: Array.isArray(hero.dailyQuestsCompleted) ? hero.dailyQuestsCompleted : (existingHeroJson.dailyQuestsCompleted ?? []),
      dailyQuestsResetDate: hero.dailyQuestsResetDate ?? existingHeroJson.dailyQuestsResetDate ?? null,
      activeQuests: Array.isArray(hero.activeQuests) ? hero.activeQuests : (Array.isArray(existingHeroJson.activeQuests) ? existingHeroJson.activeQuests : []),
      // 🔥 Локація гравця (оновлюється в startBattle) — для відображення в профілі іншим гравцям
      ...((hero as any).location || existingHeroJson.location ? { location: (hero as any).location || existingHeroJson.location } : {}),
      // 🔥 Поточне місто (вибір в ТП) — для City та GK
      ...(currentHeroJson.currentCityId || existingHeroJson.currentCityId ? { currentCityId: currentHeroJson.currentCityId || existingHeroJson.currentCityId } : {}),
      // 🔥 Вмістимість інвентарю
      ...(hero.inventoryCapacity !== undefined || existingHeroJson.inventoryCapacity !== undefined ? { inventoryCapacity: hero.inventoryCapacity ?? existingHeroJson.inventoryCapacity } : {}),
      // 🔥 Сундук переповнення
      overflowChest: Array.isArray(hero.overflowChest) ? hero.overflowChest : (Array.isArray((existingHeroJson as any).overflowChest) ? (existingHeroJson as any).overflowChest : []),
      // Панель скілів у бою — дублюємо в heroJson для синку після очищення localStorage / іншого ПК
      battleLoadoutSlots: loadLoadout(hero.name),
      // Клієнтський склад (localStorage) — дублюємо в heroJson, щоб F5 / очищення cookie не губили речі
      warehouseSlots: (() => {
        const cid = characterStore.characterId || (hero as any).id;
        const wid = typeof cid === "string" && String(cid).trim().length > 0 ? String(cid).trim() : "";
        if (wid) return loadWarehouse(wid, hero.name);
        return Array.isArray((existingHeroJson as any).warehouseSlots)
          ? (existingHeroJson as any).warehouseSlots
          : [];
      })(),
    };
    
    // Логуємо для діагностики
    const hasRequiredFields = !!(heroJsonToSave.name && heroJsonToSave.race && (heroJsonToSave.klass || heroJsonToSave.classId));
    console.log('[saveHeroToLocalStorage] heroJsonToSave (MERGE with required fields):', {
      name: heroJsonToSave.name,
      race: heroJsonToSave.race,
      klass: heroJsonToSave.klass,
      classId: heroJsonToSave.classId,
      mobsKilled: heroJsonToSave.mobsKilled,
      level: heroJsonToSave.level,
      exp: heroJsonToSave.exp,
      sp: heroJsonToSave.sp,
      skillsCount: Array.isArray(heroJsonToSave.skills) ? heroJsonToSave.skills.length : 0,
      heroBuffsCount: uniqueBuffs.length,
      hasRequiredFields,
      existingFieldsCount: Object.keys(existingHeroJson).length,
      mergedFieldsCount: Object.keys(heroJsonToSave).length,
      nameType: typeof heroJsonToSave.name,
      raceType: typeof heroJsonToSave.race,
      classIdType: typeof heroJsonToSave.classId,
    });
    
    // 🔥 КРИТИЧНО: exp/level/sp завжди беремо з hero.exp/hero.level/hero.sp (не з heroJson!)
    // І робимо clamp з останнім серверним значенням, щоб не відправити менше
    // Це запобігає помилці "exp cannot be decreased" та "sp cannot be decreased"
    const localExp = Number(hero.exp ?? 0); // Тільки з hero.exp (єдине джерело істини)
    const localLevel = Number(hero.level ?? 1);
    const localSp = Number(hero.sp ?? 0); // 🔥 Додано SP
    
    // 🔥 Отримуємо останні серверні значення з store (serverState вже отримано вище для expectedRevision)
    const serverExpKnown = serverState?.exp ?? null;
    const serverLevelKnown = serverState?.level ?? null;
    
    // 🔥 Clamp exp/level щоб не отримати "exp cannot be decreased" / "level cannot be decreased" після F5
    // Якщо локально вже вищий рівень за serverState — серверний exp з іншої «шкали» рівня, не робимо max.
    const sameLevelAsServer =
      serverLevelKnown !== null && Number(localLevel) === Number(serverLevelKnown);
    const expToSend =
      serverExpKnown !== null && (sameLevelAsServer || localLevel < serverLevelKnown)
        ? Math.max(localExp, serverExpKnown)
        : localExp;
    // Рівень беремо з героя після merge (loadHeroFromAPI). Раніше Math.max(local, serverState)
    // відновлював старий високий рівень після зниження адмінкою.
    const levelToSend = localLevel;
    // 🔥 SP НЕ clamp'имо при learn skill: localSp < serverSp — це очікувано (списали SP за скіл).
    // Clamp ламав: ми слали serverSp, сервер приймав, applyServerSync відкочував hero.sp назад.
    const spToSend = localSp;
    
    console.log('[saveHeroToLocalStorage] Sending exp/level/sp:', {
      localExp,
      localLevel,
      localSp,
      serverExpKnown,
      serverLevelKnown,
      expToSend,
      levelToSend,
      spToSend,
      expClamped: expToSend !== localExp,
      levelClamped: levelToSend !== localLevel,
    });
    
    const localCoinLuck = Number(hero.coinOfLuck ?? 0);

    // 🔥 Pre-PUT: свіжа heroRevision з БД. Heartbeat, /state, інший таб, jobs піднімають revision, а client serverState часто лишається старим → 409.
    try {
      if (characterStore.characterId) {
        const freshChar = await getCharacter(characterStore.characterId);
        if (freshChar) {
          const hj = (freshChar as any).heroJson || {};
          const r = Number(hj.heroRevision);
          const prog = readCharacterProgress(freshChar);
          if (Number.isFinite(r)) {
            heroStore.getState().updateServerState(
              {
                exp: prog.exp,
                level: prog.level,
                sp: prog.sp,
                adena: Number((freshChar as any).adena ?? 0),
                coinLuck: Number((freshChar as any).coinLuck ?? 0),
                heroRevision: r,
                updatedAt: Date.now(),
              },
              { revisionFromAuthoritativeGet: true }
            );
          }
        }
      }
    } catch (e) {
      console.warn("[saveHeroToLocalStorage] Pre-PUT getCharacter revision refresh failed:", e);
    }

    // 🔥 Останній read перед PUT: між обчисленням payload і fetch міг завершитись інший save / Realtime — без цього 409 revision_conflict.
    const stNow = heroStore.getState().serverState;
    const hNow = heroStore.getState().hero;
    expectedRevision = Number(
      stNow?.heroRevision ??
        (hNow as any)?.heroJson?.heroRevision ??
        (hNow as any)?.heroRevision ??
        expectedRevision
    );

    const updatePayload: Parameters<typeof updateCharacter>[1] = {
      heroJson: heroJsonToSave,
      level: levelToSend,
      exp: expToSend,
      sp: spToSend,
      adena: Number(hero.adena ?? 0), // завжди number (API може повертати BigInt як string)
      aa: hero.aa || 0,
      expectedRevision,
    };
    /** Не слати coinLuck нижче серверного — PUT повертає 400 «coinLuck cannot be decreased» (TvT/мердж/інший таб). */
    const serverCoinLuckKnown = Number(stNow?.coinLuck ?? 0);
    if (localCoinLuck >= serverCoinLuckKnown) {
      (updatePayload as any).coinLuck = localCoinLuck;
    }
    if ((hero as any).coins_silver !== undefined) (updatePayload as any).coinsSilver = (hero as any).coins_silver;

    const updatedCharacter = await updateCharacter(characterStore.characterId, updatePayload);
    console.log('[saveHeroToLocalStorage] Hero saved successfully via API');
    const { setLastPutAt } = await import('../heroStore');
    setLastPutAt();

    // 🔥 КРИТИЧНО: Після успішного PATCH оновлюємо heroRevision, exp, level, sp у store
    // Це запобігає наступним revision_conflict та "exp cannot be decreased" / "sp cannot be decreased"
    if (updatedCharacter) {
      const newRevision = (updatedCharacter as any).heroRevision || (updatedCharacter as any).revision
        || (updatedCharacter.heroJson as any)?.heroRevision;
      const { exp: serverExp, level: serverLevel, sp: serverSp } = readCharacterProgress(updatedCharacter);
      
      // 🔥 applyServerSync замість updateHero — не запускає persistence (прибирає рекурсію PUT→updateHero→PUT)
      const { useHeroStore } = await import('../heroStore');
      const currentHero = useHeroStore.getState().hero;
      if (currentHero) {
        const prevLevel = Number(currentHero.level ?? 1);
        const clampedExp =
          serverLevel < prevLevel ? serverExp : Math.max(currentHero.exp ?? 0, serverExp);
        const clampedSp = Math.max(currentHero.sp ?? 0, serverSp);
        // Після успішного PUT рівень у відповіді узгоджений з БД; Math.max блокував зниження (адмін / demote).
        const clampedLevel = serverLevel;
        const serverCoinLuck = Number((updatedCharacter as any).coinLuck ?? 0);
        const serverCoinsSilver = Number((updatedCharacter as any).coinsSilver ?? 0);
        const serverAdena = Number((updatedCharacter as any).adena ?? 0);
        const clampedAdena = Math.max(Number(currentHero.adena ?? 0), serverAdena);
        const clampedCoinLuck = Math.max(Number(currentHero.coinOfLuck ?? 0), serverCoinLuck);
        useHeroStore.getState().applyServerSync(
          {
            heroRevision: newRevision,
            exp: clampedExp,
            sp: clampedSp,
            level: clampedLevel,
            coins_silver: serverCoinsSilver,
            adena: clampedAdena,
            coinOfLuck: clampedCoinLuck,
          } as any,
          {
            exp: serverExp,
            level: clampedLevel,
            sp: serverSp,
            adena: serverAdena,
            coinLuck: serverCoinLuck,
            heroRevision: newRevision,
            updatedAt: Date.now(),
          }
        );
        console.log('[saveHeroToLocalStorage] Applied server sync (no persistence chain):', { revision: newRevision, exp: clampedExp, sp: clampedSp, level: clampedLevel, serverLevel });
      }
      // НЕ скидаємо queuedHero тут — якщо під час цього save прийшов новий updateHero (перемога), черга містить актуального героя; finally виконає save з ним
      retryCount = 0;
    }
    
    // ❗ ВАЖЛИВО: Також зберігаємо в localStorage як backup (навіть якщо API працює)
    // Це гарантує, що дані не втрачаться при проблемах з API
    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      let accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex === -1) {
        accounts.push({ username: current, hero: {} });
        accIndex = accounts.length - 1;
      }
      {
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
          heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero), hpFull: wasFullHp, mpFull: wasFullMp, cpFull: wasFullCp },
        };
        accounts[accIndex].hero = heroWithTimestamp;
        setJSON("l2_accounts_v2", accounts);
        console.log('[saveHeroToLocalStorage] Also saved to localStorage as backup');
      }
    }
  } catch (error: any) {
    // 🔥 Обробка rate limiting (429 Too Many Requests)
    if (error?.status === 429 || (error?.message && (error.message.includes('rate_limit') || error.message.includes('Too Many Requests')))) {
      const retrySec = Number((error as any).retryAfter);
      const cooldownMs = (Number.isFinite(retrySec) && retrySec > 0 ? retrySec : 60) * 1000;
      console.warn('[saveHeroToLocalStorage] Rate limit exceeded, saving to localStorage, cooldown', Math.ceil(cooldownMs / 1000), 's');
      
      // 🔥 КРИТИЧНО: Використовуємо retryAfter з відповіді сервера
      try {
        const { setRateLimitCooldown } = await import('../heroStore');
        setRateLimitCooldown(cooldownMs);
      } catch (e) {
        console.error('[saveHeroToLocalStorage] Failed to set rate limit cooldown:', e);
      }
      
      // 🔥 Зберігаємо в localStorage як backup — ОБОВ'ЯЗКОВО мерджимо бафи з battle state!
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const savedBattle = loadBattle(hero.name);
        const battleBuffs = Array.isArray(savedBattle?.heroBuffs) ? savedBattle.heroBuffs : [];
        const jsonBuffs = Array.isArray((hero as any).heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs : [];
        const mergedBuffs = [...battleBuffs, ...jsonBuffs].filter((b: any, i: number, arr: any[]) =>
          arr.findIndex((x: any) => (x.id && b.id && x.id === b.id) || (!x.id && !b.id && x.name === b.name)) === i
        );
        const heroJson = {
          ...((hero as any).heroJson || {}),
          ...buildBackupHeroJson(hero),
          heroBuffs: mergedBuffs.length ? mergedBuffs : ((hero as any).heroJson?.heroBuffs ?? []),
        };
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
          _rateLimitBackup: true,
          heroJson,
        };
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        let accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex === -1) {
          accounts.push({ username: current, hero: {} });
          accIndex = accounts.length - 1;
        }
        {
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
          console.log('[saveHeroToLocalStorage] Saved to localStorage due to rate limit (buffs:', mergedBuffs.length, ')');
        }
      }
      
      // Не кидаємо помилку - дані збережені в localStorage
      return;
    }
    
    // 🔥 Обробка "exp/level/sp cannot be decreased" (400) — refetch, merge з max, retry
    // "top cannot be destroyed/destroed" = можливе спотворення/encoding цього ж повідомлення
    // "map/rop cannot be destructured" = серверна помилка при парсингу (можливо heroJson)
    const isExpLevelSpDecreased = error?.status === 400 && error?.message && (
      error.message.includes('exp cannot be decreased') ||
      error.message.includes('level cannot be decreased') ||
      error.message.includes('sp cannot be decreased') ||
      error.message.includes('top cannot be destroy') ||
      error.message.includes('cannot be destructured')
    );
    // 🔥 Обробка конфлікту ревізії (409 Conflict або revision_conflict)
    if (isExpLevelSpDecreased || error?.status === 409 || (error?.message && (error.message.includes('revision_conflict') || error.message.includes('revision conflict') || error.message.includes('Character was modified')))) {
      if (isExpLevelSpDecreased) {
        console.warn('[saveHeroToLocalStorage] exp/level/sp decreased — refetching from server and retrying');
      }
      if (error?.status === 409) {
        await applyHeroRevisionFrom409Body(error);
      }

      // Ігноруємо якщо це просто конфлікт при фоновому збереженні
      // Ми не хочемо спамити користувачу alert-ами
      if (retryCount >= MAX_RETRIES) {
        // 🔥 КРИТИЧНО: При exp error — зберігаємо хоча б inventory (куплені предмети не зникнуть після F5)
        if (isExpLevelSpDecreased) {
          const cs = useCharacterStore.getState();
          if (cs.characterId) {
            const source = (await import('../heroStore')).useHeroStore.getState().hero ?? hero;
            const inv = Array.isArray(source?.inventory) ? source.inventory : [];
            const chest = Array.isArray((source as any)?.overflowChest) ? (source as any).overflowChest : [];
            try {
              await updateInventoryAPI(cs.characterId, { inventory: inv, overflowChest: chest });
              console.log('[saveHeroToLocalStorage] Saved inventory via fallback (exp error)');
            } catch (e) {
              console.warn('[saveHeroToLocalStorage] Inventory fallback failed:', e);
            }
          }
        }
        return;
      }
      retryCount++;
      // console.log(`[saveHeroToLocalStorage] Attempting automatic retry ${retryCount}/${MAX_RETRIES} after revision conflict...`);
      
      try {
        // 1. Отримуємо актуального героя з сервера (GET /characters/:id)
        const characterStore = useCharacterStore.getState();
        const currentCharacter = await getCharacter(characterStore.characterId);
        const { useHeroStore } = await import('../heroStore');
        const currentHero = useHeroStore.getState().hero;
        // 🔥 КРИТИЧНО: використовуємо currentHero (зі store), а не hero (параметр) — hero може бути застарілим,
        // якщо між запуском save і 409 викликався learnSkill (наприклад, при race з fixProfession на GuildScreen)
        const localSource = currentHero ?? hero;
        if (currentCharacter) {
          // 2. Мержимо локальні дельти (exp/mobsKilled/skills/buffs) з серверним станом
          const serverHeroJson = currentCharacter.heroJson || {};
          const localMobsKilled = (localSource as any).mobsKilled ?? (hero as any).mobsKilled ?? 0;
          const serverMobsKilled = serverHeroJson.mobsKilled ?? 0;
          const localExp = localSource.exp ?? hero.exp ?? 0;
          const serverExp = serverHeroJson.exp ?? Number(currentCharacter.exp) ?? 0;
          const localSkills = localSource.skills ?? hero.skills ?? [];
          const serverSkills = serverHeroJson.skills ?? [];
            
            // 🔥 КРИТИЧНО: Merge exp/mobsKilled - беремо більше значення (щоб не втратити прогрес)
            // Для mobsKilled це ок, бо це лічильник "назавжди"
            // Для exp теж ок, бо це накопичувальний прогрес
            // Якщо в майбутньому буде втрата exp при смерті - потрібно буде змінити логіку
            const mergedMobsKilled = Math.max(localMobsKilled, serverMobsKilled);
            const mergedExp = Math.max(localExp, serverExp);
            
            // Об'єднуємо skills (уникаємо дублікатів)
            const mergedSkills = [...serverSkills];
            localSkills.forEach((localSkill: any) => {
              const existing = mergedSkills.find((s: any) => s.id === localSkill.id);
              if (existing) {
                // Якщо локальний рівень вищий - оновлюємо
                if (localSkill.level > existing.level) {
                  existing.level = localSkill.level;
                }
              } else {
                mergedSkills.push(localSkill);
              }
            });
            
            // 🔥 КРИТИЧНО: Об'єднуємо бафи з нормалізацією та очищенням прострочених
            const heroName = localSource.name ?? hero.name;
            const savedBattle = loadBattle(heroName);
            const battleBuffs = savedBattle?.heroBuffs || [];
            const serverBuffs = Array.isArray(serverHeroJson.heroBuffs) ? serverHeroJson.heroBuffs : [];
            const localBuffs = Array.isArray((localSource as any).heroJson?.heroBuffs) ? (localSource as any).heroJson.heroBuffs : Array.isArray((hero as any).heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs : [];
            const allBuffs = [...serverBuffs, ...localBuffs, ...battleBuffs];
            
            // Нормалізуємо бафи: об'єднуємо за buffId/source, беремо максимальний expiresAt
            const now = Date.now();
            const buffMap = new Map<string, any>();
            
            allBuffs.forEach((buff: any) => {
              // Пропускаємо прострочені бафи (якщо expiresAt є і він менше now)
              if (buff.expiresAt && typeof buff.expiresAt === 'number' && buff.expiresAt < now) {
                return; // Пропускаємо прострочений баф
              }
              
              // Створюємо ключ для групування: id або name
              const key = buff.id ? `id_${buff.id}` : `name_${buff.name || ''}`;
              const existing = buffMap.get(key);
              
              if (!existing) {
                // Перший баф з таким id/name
                buffMap.set(key, { ...buff });
              } else {
                // Якщо вже є - беремо максимальний expiresAt або останній apply
                if (buff.expiresAt && existing.expiresAt) {
                  // Беремо максимальний expiresAt (більш тривалий баф)
                  if (buff.expiresAt > existing.expiresAt) {
                    buffMap.set(key, { ...buff });
                  }
                } else if (buff.expiresAt && !existing.expiresAt) {
                  // Якщо новий має expiresAt, а старий ні - беремо новий
                  buffMap.set(key, { ...buff });
                } else if (!buff.expiresAt && existing.expiresAt) {
                  // Якщо старий має expiresAt, а новий ні - залишаємо старий
                  // (toggle бафи мають Number.MAX_SAFE_INTEGER)
                }
              }
            });
            
            const mergedBuffs = Array.from(buffMap.values());
            
            // Додатково очищаємо через cleanupBuffs (якщо є expiresAt)
            const { cleanupBuffs } = await import('../battle/helpers');
            const cleanedBuffs = cleanupBuffs(mergedBuffs, now);
            
            // 3. Оновлюємо hero в store з актуальною ревізією та змердженими даними
            const heroBase = currentHero ?? hero;
            if (heroBase) {
              // 🔥 GET може відстати від БД (кеш/репліка); тіло 409 вже оновило serverState — не знижувати ревізію.
              const fromGet = Number(
                (currentCharacter as any).heroRevision ??
                  (currentCharacter as any).revision ??
                  (serverHeroJson as any).heroRevision ??
                  0
              );
              const storeRev = Number(useHeroStore.getState().serverState?.heroRevision ?? 0);
              const localRev = Number(
                (heroBase as any).heroRevision ?? (heroBase as any).heroJson?.heroRevision ?? 0
              );
              const newRevision = Math.max(
                Number.isFinite(fromGet) ? fromGet : 0,
                Number.isFinite(storeRev) ? storeRev : 0,
                Number.isFinite(localRev) ? localRev : 0
              );
              const progRetry = readCharacterProgress(currentCharacter);
              const serverLevel = progRetry.level;
              const serverSp = progRetry.sp;
              const localLv = Number(heroBase.level ?? 1);
              const mergedLevel =
                serverLevel < localLv ? serverLevel : Math.max(localLv, serverLevel);
              const mergedSp = Math.max(heroBase.sp ?? 0, serverSp);

              // 🔥 КРИТИЧНО: після купівлі лоту на ринку сервер уже нарахував адену/CoL, а локальний store ще старий.
              // Без max() retry PUT перезапише БД старою сумою — «продав, а грошей немає».
              const serverAdena = Number((currentCharacter as any).adena ?? 0);
              const localAdena = Number(heroBase.adena ?? (heroBase as any).heroJson?.adena ?? 0);
              const mergedAdena = Math.max(localAdena, serverAdena);
              const serverCol = Number((currentCharacter as any).coinLuck ?? 0);
              const localCol = Number(
                (heroBase as any).coinOfLuck ?? (heroBase as any).heroJson?.coinOfLuck ?? 0
              );
              const mergedCoinLuck = Math.max(localCol, serverCol);

              const mergedHero = {
                ...heroBase,
                exp: mergedExp,
                level: mergedLevel,
                sp: mergedSp,
                adena: mergedAdena,
                coinOfLuck: mergedCoinLuck,
                mobsKilled: mergedMobsKilled as any,
                skills: mergedSkills,
                heroRevision: newRevision,
                heroJson: {
                  ...(heroBase as any).heroJson,
                  ...serverHeroJson,
                  exp: mergedExp,
                  mobsKilled: mergedMobsKilled,
                  skills: mergedSkills,
                  heroBuffs: cleanedBuffs,
                  adena: mergedAdena,
                  coinOfLuck: mergedCoinLuck,
                  heroRevision: newRevision,
                },
              };

              // applyServerSync замість setHero — оновлює store без запуску persistence; retry з поточного hero
              useHeroStore.getState().applyServerSync(mergedHero as any, {
                exp: mergedExp,
                level: mergedLevel,
                sp: serverSp,
                adena: mergedAdena,
                coinLuck: mergedCoinLuck,
                heroRevision: newRevision,
                updatedAt: Date.now(),
              });
              // console.log('[saveHeroToLocalStorage] Hero rehydrated and merged, retrying save with revision:', newRevision);

              const heroToSave = useHeroStore.getState().hero;
              if (heroToSave) await saveHeroOnce(heroToSave);
              // console.log('[saveHeroToLocalStorage] Successfully saved after retry');
              return; // Успішно збережено після retry
            }
          }
        } catch (reloadError: any) {
          if (reloadError?.status === 409) {
            await applyHeroRevisionFrom409Body(reloadError);
          }
          // 🔥 Якщо retry теж отримав 409 або exp/level/sp decreased — зупиняємося
          const reloadIsConflict = reloadError?.status === 409 || (reloadError?.message && reloadError.message.includes('revision_conflict'));
          const reloadIsExpDecreased = reloadError?.status === 400 && reloadError?.message?.includes?.('cannot be decreased');
          if (reloadIsConflict || reloadIsExpDecreased) {
            // console.error('[saveHeroToLocalStorage] Retry also failed with revision_conflict - stopping auto-retry');
            // Можна показати toast/notification користувачу: "Оновіть сторінку"
            if (typeof window !== 'undefined' && window.alert) {
              // Не виводимо alert, щоб не спамити
              // console.warn('Конфлікт версій персонажа. (тиха помилка)');
            }
          }
          
          retryCount = MAX_RETRIES; // Не намагаємося більше
        }
      
      // Якщо retry не вдався або досягнуто максимум - зберігаємо локальну версію як backup
      // console.warn('[saveHeroToLocalStorage] Revision conflict - saving to localStorage as backup');
      
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        let accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex === -1) {
          accounts.push({ username: current, hero: {} });
          accIndex = accounts.length - 1;
        }
        {
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            _conflictBackup: true,
            _conflictServerState: error?.details?.serverState || null,
            heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
          // console.warn('[saveHeroToLocalStorage] Local version saved as backup due to 409 conflict');
        }
      }
      
      // Не викидаємо помилку - дані збережені в localStorage
      // console.warn('[saveHeroToLocalStorage] 409 conflict handled, data saved to localStorage');
      return;
    }
    
    // Ігноруємо якщо це просто конфлікт при фоновому збереженні
    if (error?.message && (error.message.includes('revision_conflict') || error.message.includes('Character was modified'))) {
        return;
    }
    
    // 🔥 exp/level/sp decreased або cannot be destructured — вже оброблено retry; не логуємо (дані збережені в localStorage)
    const isHandledSyncError = error?.status === 400 && error?.message && (
      error.message.includes('cannot be decreased') || error.message.includes('top cannot be destroy') || error.message.includes('cannot be destructured')
    );
    if (!isHandledSyncError) {
      console.error('[saveHeroToLocalStorage] Failed to save hero via API:', error?.message || error);
    }
    
    // Fallback to localStorage on error - ВАЖЛИВО для збереження даних!
    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      let accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex === -1) {
        accounts.push({ username: current, hero: {} });
        accIndex = accounts.length - 1;
      }
      {
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
          heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
        };
        accounts[accIndex].hero = heroWithTimestamp;
        setJSON("l2_accounts_v2", accounts);
        console.log('[saveHeroToLocalStorage] Saved to localStorage (fallback)');
      }
    }
  }
}
