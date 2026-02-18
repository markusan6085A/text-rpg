// Async function to load hero from API
import { getCharacter, updateCharacter } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { fixHeroProfession } from "../../utils/fixProfession";
import { loadBattle } from "../battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import { createNewHero } from "../heroFactory";
import type { Hero } from "../../types/Hero";
import { checkSyncConflict, resolveSyncConflict, getConflictMessage, saveLocalBackup } from "./syncPolicy";
import { loadHero } from "./heroLoad";
import { hydrateHero } from "./heroHydration";
import { restoreFromPercentOrFallback } from "./restoreResourceFromPercent";
import { getRateLimitRemainingMs } from "../heroStore";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

// 🔥 ВИДАЛЕНО: window.__lastServerExp та глобальні змінні
// Тепер використовуємо serverState з heroStore

export async function loadHeroFromAPI(): Promise<Hero | null> {
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

  console.log('[loadHeroFromAPI] Starting, auth:', authStore.isAuthenticated, 'characterId:', characterStore.characterId);

  // If not authenticated, return null
  if (!authStore.isAuthenticated || !characterStore.characterId) {
    console.log('[loadHeroFromAPI] Not authenticated or no characterId, returning null');
    return null;
  }

  // 🔥 Правило №1: під час rate limit cooldown НЕ робимо GET — одразу повертаємо локального героя
  if (getRateLimitRemainingMs() > 0) {
    const localHero = loadHero();
    const hydrated = hydrateHero(localHero);
    if (hydrated) {
      console.warn('[loadHeroFromAPI] Cooldown active, returning local hero without GET');
      return hydrated;
    }
    return localHero ? hydrateHero(localHero) : null;
  }

  try {
    // 🔥 Правило 1: Local-first старт - завантажуємо локальну версію спочатку
    const localHero = loadHero();
    const hydratedLocalHero = hydrateHero(localHero);
    
    // Load character from API
    console.log('[loadHeroFromAPI] Fetching character from API...');
    let character;
    try {
      character = await getCharacter(characterStore.characterId);
    } catch (apiErr: any) {
      // 🔥 При 429 сервер не приймає запити — використовуємо локальну версію, щоб після F5 не відкатилось
      if (apiErr?.status === 429 || apiErr?.message?.includes?.('rate_limit')) {
        console.warn('[loadHeroFromAPI] Rate limit on GET character, using local hero to avoid rollback');
        if (hydratedLocalHero) return hydratedLocalHero;
        return localHero ? hydrateHero(localHero) : null;
      }
      throw apiErr;
    }
    console.log('[loadHeroFromAPI] Character received:', character ? 'success' : 'null', character?.id);
    
    // 🔥 Єдина логіка: накопичувальні (exp, level, sp, adena, mobsKilled) — "більше" = новіше.
    // Skills — порівнюємо суму рівнів, не кількість (3 скіли рівня 3 краще за 4 скіли рівня 1).
    // Inventory/buffs — не порівнюємо "більше/менше", для них інший критерій.
    // Останній запобіжник: local.lastSavedAt > server.updatedAt → локалка новіша, лишаємо навіть при рівних значеннях.
    if (character && hydratedLocalHero) {
      const heroData = character.heroJson as any;
      const serverSkillsArr = Array.isArray(heroData?.skills) ? heroData.skills : [];
      const localSkillsArr = Array.isArray(hydratedLocalHero.skills) ? hydratedLocalHero.skills : [];
      const skillLevelSum = (arr: any[]) => arr.reduce((s, sk) => s + (Number((sk as any).level) || 1), 0);
      const serverSkillLevelsSum = skillLevelSum(serverSkillsArr);
      const localSkillLevelsSum = skillLevelSum(localSkillsArr);
      const serverMobsKilled = Number(heroData?.mobsKilled ?? 0);
      const localMobsKilled = Number((hydratedLocalHero as any).mobsKilled ?? (hydratedLocalHero as any).heroJson?.mobsKilled ?? 0);
      // 🔥 КРИТИЧНО: Всі значення в Number() — API може повертати рядки, інакше localExp > serverExp дає хибний результат
      const serverExp = Number(character.exp ?? heroData?.exp ?? 0);
      const localExp = Number(hydratedLocalHero.exp ?? (hydratedLocalHero as any).heroJson?.exp ?? 0);
      const serverLevel = Number(character.level ?? heroData?.level ?? 1);
      const localLevel = Number(hydratedLocalHero.level ?? (hydratedLocalHero as any).heroJson?.level ?? 1);
      const serverSp = Number(character.sp ?? heroData?.sp ?? 0);
      const localSp = Number(hydratedLocalHero.sp ?? (hydratedLocalHero as any).heroJson?.sp ?? 0);
      const serverAdena = Number(character.adena ?? heroData?.adena ?? 0);
      const localAdena = Number(hydratedLocalHero.adena ?? (hydratedLocalHero as any).heroJson?.adena ?? 0);
      const localLastSavedAt = (hydratedLocalHero as any).lastSavedAt || 0;
      const serverUpdatedAt = character.updatedAt ? new Date(character.updatedAt).getTime() : 0;
      const localNewerByTimestamp = localLastSavedAt > 0 && serverUpdatedAt > 0 && localLastSavedAt > serverUpdatedAt;

      // 🔥 КРИТИЧНО: Якщо локально є активні бафи (наприклад зі статуї), а на сервері їх немає/менше — лишаємо локальну версію
      // Інакше після loadHeroFromAPI ми перезаписуємо store серверним героєм і бафи "зникають через секунду"
      const now = Date.now();
      const localBuffsFromJson = Array.isArray((hydratedLocalHero as any).heroJson?.heroBuffs) ? (hydratedLocalHero as any).heroJson.heroBuffs : [];
      const localBuffsFromBattle = loadBattle(hydratedLocalHero.name);
      const localBuffsMerged = [...localBuffsFromJson, ...(localBuffsFromBattle?.heroBuffs || [])];
      const localBuffsDeduped = localBuffsMerged.filter((b: any, i: number, arr: any[]) =>
        arr.findIndex((x: any) => (x.id && b.id && x.id === b.id) || (!x.id && !b.id && x.name === b.name)) === i
      );
      const localActiveBuffsCount = cleanupBuffs(localBuffsDeduped, now).length;
      const serverBuffs = Array.isArray(heroData?.heroBuffs) ? heroData.heroBuffs : [];
      const serverActiveBuffsCount = cleanupBuffs(serverBuffs, now).length;
      const localHasActiveBuffsNotOnServer = localActiveBuffsCount > serverActiveBuffsCount && localActiveBuffsCount > 0;

      const localHasMoreProgress =
        localNewerByTimestamp ||
        localHasActiveBuffsNotOnServer ||
        localExp > serverExp ||
        localLevel > serverLevel ||
        localSp > serverSp ||
        localAdena > serverAdena ||
        localSkillLevelsSum > serverSkillLevelsSum ||
        localMobsKilled > serverMobsKilled;

      if (localHasMoreProgress) {
        const reason = localHasActiveBuffsNotOnServer ? 'local has active buffs' : (localNewerByTimestamp ? 'lastSavedAt > server.updatedAt' : 'more progress');
        console.warn('[loadHeroFromAPI] Local preferred:', reason, localHasActiveBuffsNotOnServer ? { localActiveBuffsCount, serverActiveBuffsCount } : { localLevel, serverLevel, localExp, serverExp, localSp, serverSp, localAdena, serverAdena, localSkillLevelsSum, serverSkillLevelsSum, localMobsKilled, serverMobsKilled });
        // 🔥 КРИТИЧНО: перераховуємо maxHp/maxMp/maxCp по локальному герою (екіп + скіли), інакше після F5 залишається старий max
        const now = Date.now();
        const savedBattle = loadBattle(hydratedLocalHero.name);
        const heroJsonBuffs = Array.isArray((hydratedLocalHero as any).heroBuffs) ? (hydratedLocalHero as any).heroBuffs : Array.isArray((hydratedLocalHero as any).heroJson?.heroBuffs) ? (hydratedLocalHero as any).heroJson.heroBuffs : [];
        const savedBattleBuffs = savedBattle?.heroBuffs || [];
        const allBuffs = [...heroJsonBuffs, ...savedBattleBuffs];
        const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
        const bestByKey = new Map<string, any>();
        for (const b of allBuffs) {
          const key = byKey(b);
          const cur = bestByKey.get(key);
          const exp = b.expiresAt ?? 0;
          if (!cur || (cur.expiresAt ?? 0) < exp) bestByKey.set(key, b);
        }
        const savedBuffs = cleanupBuffs(Array.from(bestByKey.values()), now);
        const recalculated = recalculateAllStats(hydratedLocalHero, []);
        const baseMax = { maxHp: recalculated.resources.maxHp, maxMp: recalculated.resources.maxMp, maxCp: recalculated.resources.maxCp };
        const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
        const heroData = character.heroJson as any;
        const serverMaxHp = heroData?.maxHp != null ? Number(heroData.maxHp) : 0;
        const serverMaxMp = heroData?.maxMp != null ? Number(heroData.maxMp) : 0;
        const serverMaxCp = heroData?.maxCp != null ? Number(heroData.maxCp) : 0;
        const localMaxHp = hydratedLocalHero.maxHp ?? 0;
        const serverMaxNotStale = serverMaxHp >= localMaxHp * 0.9 && serverMaxMp >= (hydratedLocalHero.maxMp ?? 0) * 0.9 && serverMaxCp >= (hydratedLocalHero.maxCp ?? 0) * 0.9;
        const serverHp = serverMaxNotStale && heroData?.hp != null ? Number(heroData.hp) : undefined;
        const serverMp = serverMaxNotStale && heroData?.mp != null ? Number(heroData.mp) : undefined;
        const serverCp = serverMaxNotStale && heroData?.cp != null ? Number(heroData.cp) : undefined;
        const mergedHero: Hero = {
          ...hydratedLocalHero,
          maxHp: buffedMax.maxHp,
          maxMp: buffedMax.maxMp,
          maxCp: buffedMax.maxCp,
          hp: serverHp !== undefined ? Math.min(serverHp, buffedMax.maxHp) : Math.min(hydratedLocalHero.hp ?? buffedMax.maxHp, buffedMax.maxHp),
          mp: serverMp !== undefined ? Math.min(serverMp, buffedMax.maxMp) : Math.min(hydratedLocalHero.mp ?? buffedMax.maxMp, buffedMax.maxMp),
          cp: serverCp !== undefined ? Math.min(serverCp, buffedMax.maxCp) : Math.min(hydratedLocalHero.cp ?? buffedMax.maxCp, buffedMax.maxCp),
        };
        (mergedHero as any).baseMaxHp = recalculated.resources.maxHp;
        (mergedHero as any).baseMaxMp = recalculated.resources.maxMp;
        (mergedHero as any).baseMaxCp = recalculated.resources.maxCp;
        import('./heroPersistence').then(({ saveHeroToLocalStorage }) => {
          saveHeroToLocalStorage(mergedHero).catch((err: any) => {
            console.warn('[loadHeroFromAPI] Background push of local hero failed:', err?.message || err);
          });
        });
        return mergedHero;
      }
      
      // 🔥 Перевіряємо конфлікт синхронізації (для інших випадків)
      const conflict = checkSyncConflict(character, hydratedLocalHero);
      if (conflict.hasConflict) {
        const resolution = resolveSyncConflict(conflict);
        const message = getConflictMessage(conflict);
        
        console.warn('[loadHeroFromAPI] Sync conflict detected:', conflict);
        console.log('[loadHeroFromAPI] Resolution:', resolution, message);
        
        // ❗ ВАЖЛИВО: Зберігаємо локальну версію як backup перед заміною
        if (conflict.localNewer) {
          saveLocalBackup(hydratedLocalHero, conflict);
          console.warn('[loadHeroFromAPI] Local version is newer, saved as backup. Using server version for safety.');
        } else if (conflict.serverNewer) {
          console.log('[loadHeroFromAPI] Server version is newer, using server version.');
        }
      }
    }
    
    // 🔥 НЕ славимо heartbeat тут — Layout вже славить через 5 с і кожні 2 хв. Менше запитів = менше 429.
    
    // Якщо character не отримано - повертаємо null (fallback на localStorage)
    if (!character) {
      console.warn('[loadHeroFromAPI] Character not found, returning null for localStorage fallback');
      return null;
    }
    
    // Extract hero data from character.heroJson
    const heroData = character.heroJson as any;

    // 🔥 КРИТИЧНО: Читаємо mobsKilled ДО будь-яких маніпуляцій з heroData
    const mobsKilledFromData = heroData?.mobsKilled ?? heroData?.mobs_killed ?? heroData?.killedMobs ?? heroData?.totalKills ?? undefined;

    // Логуємо mobsKilled для діагностики (завжди, не тільки в DEV)
    console.log('[loadHeroFromAPI] mobsKilled from heroJson:', mobsKilledFromData, 'heroData keys:', heroData ? Object.keys(heroData).slice(0, 20) : 'no heroData');
    
    // Нормалізуємо слот інвентаря з itemsDB (адмінка дає slot "inventory" або "other" — підставляємо правильний)
    if (heroData?.inventory && Array.isArray(heroData.inventory)) {
      heroData.inventory = heroData.inventory.map((it: any) => {
        if (it.slot === "inventory" || !it.slot) {
          const def = itemsDB[it.id || it.itemId] || itemsDBWithStarter[it.id || it.itemId];
          if (def) return { ...it, slot: def.slot || "other", name: it.name || def.name };
        }
        return it;
      });
      console.log('[loadHeroFromAPI] Inventory found in heroJson:', {
        count: heroData.inventory.length,
        items: heroData.inventory.map((i: any) => ({ id: i.id, count: i.count, slot: i.slot }))
      });
    } else {
      console.warn('[loadHeroFromAPI] No inventory found in heroJson');
    }
    
    // Check if heroJson is empty or invalid - if so, create a new hero from character data
    let fixedHero: Hero;
    if (!heroData || typeof heroData !== 'object' || Object.keys(heroData).length === 0) {
      console.warn('Empty heroJson in character, creating new hero from character data:', character.id);
      // Create a new hero from character data
      const newHero = createNewHero({
        id: `hero_${Date.now()}`,
        name: character.name,
        username: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
      });
      fixedHero = fixHeroProfession(newHero);
      // Override with character data (these are the source of truth)
      fixedHero.level = character.level;
      fixedHero.exp = Number(character.exp);
      fixedHero.sp = character.sp;
      fixedHero.adena = character.adena;
      fixedHero.coinOfLuck = character.coinLuck;
      (fixedHero as any).coins_silver = (character as any).coinsSilver ?? 0;
      fixedHero.aa = character.aa || 0;
      // 🔥 КРИТИЧНО: Зберігаємо mobsKilled, level, exp навіть для нового героя (якщо воно було в heroData)
      const finalMobsKilled = mobsKilledFromData !== undefined ? mobsKilledFromData : 0;
      (fixedHero as any).mobsKilled = finalMobsKilled;
      // 🔥 Схема A: heroJson лише для серіалізації
      // Встановлюємо skills/mobsKilled на верхній рівень hero
      fixedHero.skills = fixedHero.skills || [];
      (fixedHero as any).mobsKilled = finalMobsKilled;
    } else {
      // Merge character data with heroJson
      // 🔥 ВАЖЛИВО: mobsKilled має зберігатися з heroJson (вже прочитано вище)
      const finalMobsKilled = mobsKilledFromData !== undefined ? mobsKilledFromData : 0;
      
      // 🔥 КРИТИЧНО: Рівень може бути в heroJson.level (новіше) або в character.level (старе)
      // Використовуємо більше значення, щоб не втратити рівень
      const heroJsonLevel = (heroData as any).level;
      const finalLevel = heroJsonLevel !== undefined && heroJsonLevel > character.level 
        ? heroJsonLevel 
        : character.level;
      
      // 🔥 КРИТИЧНО: EXP також може бути в heroJson
      const heroJsonExp = (heroData as any).exp;
      const finalExp = heroJsonExp !== undefined && heroJsonExp > Number(character.exp)
        ? heroJsonExp
        : Number(character.exp);
      
      // 🔥 КРИТИЧНО: Не посилатися на fixedHero до його ініціалізації (ReferenceError якщо heroData.skills порожні)
      const serverSkillsArr = Array.isArray((heroData as any).skills) ? (heroData as any).skills : [];
      
      fixedHero = fixHeroProfession({
        ...heroData,
        level: finalLevel,
        exp: finalExp,
        sp: character.sp,
        adena: character.adena,
        coinOfLuck: character.coinLuck,
        coins_silver: (character as any).coinsSilver ?? 0,
        aa: character.aa || 0,
        name: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
        skills: serverSkillsArr,
        mobsKilled: finalMobsKilled as any,
      } as Hero);
    }

    // 🔥 КРИТИЧНО: Union-merge equipment і skills — ніколи не губити плащ/пояс/доп. скіли після F5.
    // Беремо об'єднання: екіп = всі слоти з сервера + локаль (локаль має пріоритет на конфлікт);
    // скіли = об'єднання по id з більшим рівнем.
    const serverSkillsForMerge = Array.isArray((heroData as any)?.skills) ? (heroData as any).skills : [];
    const localSkills = hydratedLocalHero?.skills || [];
    const skillById = new Map<number, { id: number; level: number }>();
    for (const s of serverSkillsForMerge) {
      const id = Number((s as any).id);
      const lvl = Number((s as any).level) || 1;
      if (id) skillById.set(id, { id, level: lvl });
    }
    for (const s of localSkills) {
      const id = Number((s as any).id);
      const lvl = Number((s as any).level) || 1;
      if (!id) continue;
      const cur = skillById.get(id);
      if (!cur || cur.level < lvl) skillById.set(id, { id, level: lvl });
    }
    const finalSkillsForRecalc =
      skillById.size > 0
        ? Array.from(skillById.values()).map(({ id, level }) => ({ id, level }))
        : (fixedHero.skills || []);

    const serverEquip = fixedHero.equipment ?? {};
    const localEquip = hydratedLocalHero?.equipment ?? {};
    const mergedEquipment = { ...serverEquip, ...localEquip };

    const serverInv = fixedHero.inventory ?? [];
    const localInv = hydratedLocalHero?.inventory ?? [];
    const serverInvLen = Array.isArray(serverInv) ? serverInv.length : 0;
    const localInvLen = Array.isArray(localInv) ? localInv.length : 0;
    const mergedInventory = localInvLen >= serverInvLen ? localInv : serverInv;

    const localDyes = hydratedLocalHero?.activeDyes ?? [];
    const serverDyes = fixedHero.activeDyes ?? [];
    const mergedActiveDyes = (localDyes.length >= serverDyes.length ? localDyes : serverDyes) as any;

    const heroForRecalc: Hero = {
      ...fixedHero,
      skills: finalSkillsForRecalc,
      equipment: mergedEquipment,
      inventory: mergedInventory,
      activeDyes: mergedActiveDyes,
    };

    // Recalculate stats (same logic as localStorage version)
    const now = Date.now();
    const savedBattle = loadBattle(fixedHero.name);
    
    // 🔥 КРИТИЧНО: Бафи можуть бути в heroJson.heroBuffs (з сервера) або в savedBattle.heroBuffs (localStorage)
    // Сервер зберігає heroBuffs на верхньому рівні heroJson (character.heroJson.heroBuffs)
    // fixedHero = { ...heroData } → heroBuffs може бути у fixedHero.heroBuffs або fixedHero.heroJson?.heroBuffs
    const heroJsonBuffs = Array.isArray((fixedHero as any).heroBuffs) 
      ? (fixedHero as any).heroBuffs 
      : Array.isArray((fixedHero as any).heroJson?.heroBuffs) 
        ? (fixedHero as any).heroJson.heroBuffs 
        : [];
    const savedBattleBuffs = savedBattle?.heroBuffs || [];
    
    // Об'єднуємо бафи з сервера та з battle (статуя зберігає в battle). При однаковому id/stackType
    // залишаємо баф з більшим expiresAt (свіжіший), щоб щойно взяті бафи статуї не пропадали після GET
    const allBuffs = [...heroJsonBuffs, ...savedBattleBuffs];
    const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
    const bestByKey = new Map<string, any>();
    for (const b of allBuffs) {
      const key = byKey(b);
      const cur = bestByKey.get(key);
      const exp = b.expiresAt ?? 0;
      if (!cur || (cur.expiresAt ?? 0) < exp) bestByKey.set(key, b);
    }
    const uniqueBuffs = Array.from(bestByKey.values());
    
    const savedBuffs = cleanupBuffs(uniqueBuffs, now);
    const recalculated = recalculateAllStats(heroForRecalc, []);

    const baseMax = {
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
    };
    const heroDataAny = heroData as any;
    const serverIsDead = Boolean(heroDataAny?.isDead) || Number(heroDataAny?.deadAt) > 0;
    const localJson = (hydratedLocalHero as any)?.heroJson || {};
    const localIsDead = Boolean(localJson.isDead) || Number(localJson.deadAt || 0) > 0;
    const localHp = Number(hydratedLocalHero?.hp ?? 0);
    // Якщо сервер ще має isDead (resurrect не встиг зберегтися), а локально герой вже живий — не перезаписувати hp на 0
    const preferLocalAlive = serverIsDead && !localIsDead && localHp > 0;
    const isDead = preferLocalAlive ? false : serverIsDead;
    const finalBuffs = isDead ? [] : savedBuffs;
    const buffedMax = computeBuffedMaxResources(baseMax, finalBuffs);

    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;

    // Якщо сервер повернув старі/менші max (наприклад до ап рівня) — при F5 hp/mp/cp не повинні падати
    const oldMaxHp = fixedHero.maxHp ?? 0;
    const oldMaxMp = fixedHero.maxMp ?? 0;
    const oldMaxCp = fixedHero.maxCp ?? 0;
    const newMaxIncreasedHp = recalculated.resources.maxHp > oldMaxHp * 1.05;
    const newMaxIncreasedMp = recalculated.resources.maxMp > oldMaxMp * 1.05;
    const newMaxIncreasedCp = recalculated.resources.maxCp > oldMaxCp * 1.05;
    const fillHp = newMaxIncreasedHp || oldMaxHp <= 0;
    const fillMp = newMaxIncreasedMp || oldMaxMp <= 0;
    const fillCp = newMaxIncreasedCp || oldMaxCp <= 0;

    let finalHp: number;
    let finalMp: number;
    let finalCp: number;
    if (preferLocalAlive) {
      finalHp = Math.min(finalMaxHp, Math.max(1, localHp));
      finalMp = Math.min(finalMaxMp, Math.max(0, Number(hydratedLocalHero?.mp ?? 0)));
      finalCp = Math.min(finalMaxCp, Math.max(0, Number(hydratedLocalHero?.cp ?? 0)));
    } else {
      finalHp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.hpPercent,
        fullFlag: Boolean(heroData?.hpFull) || fillHp,
        savedValueRaw: fixedHero.hp,
        savedMaxRaw: heroDataAny?.maxHp,
        finalMax: finalMaxHp,
        isDead,
      });
      finalMp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.mpPercent,
        fullFlag: Boolean(heroData?.mpFull) || fillMp,
        savedValueRaw: fixedHero.mp,
        savedMaxRaw: heroDataAny?.maxMp,
        finalMax: finalMaxMp,
        isDead,
      });
      finalCp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.cpPercent,
        fullFlag: Boolean(heroData?.cpFull) || fillCp,
        savedValueRaw: fixedHero.cp,
        savedMaxRaw: heroDataAny?.maxCp,
        finalMax: finalMaxCp,
        isDead,
      });
    }

    if (import.meta.env.DEV) {
      console.log("[loadHeroFromAPI] load HP snapshot:", {
        finalMaxHp,
        hpPercent: heroDataAny?.hpPercent,
        finalHp,
        isDead,
        preferLocalAlive: preferLocalAlive || undefined,
      });
    }

    // 🔥 КРИТИЧНО: Зберігаємо mobsKilled з fixedHero і гарантуємо, що воно є в heroJson
    // Перевіряємо всі можливі місця, де може бути mobsKilled
    const currentMobsKilled = (fixedHero as any).mobsKilled ?? 
                              (fixedHero as any).mobs_killed ?? 
                              (fixedHero as any).killedMobs ?? 
                              (fixedHero as any).totalKills ?? 
                              ((fixedHero as any).heroJson?.mobsKilled) ??
                              ((fixedHero as any).heroJson?.mobs_killed) ??
                              ((fixedHero as any).heroJson?.killedMobs) ??
                              ((fixedHero as any).heroJson?.totalKills) ??
                              0;
    const existingHeroJson = (fixedHero as any).heroJson || {};
    
    // Логуємо mobsKilled для діагностики (завжди, не тільки в DEV)
    console.log('[loadHeroFromAPI] mobsKilled before recalc:', currentMobsKilled, 'from fixedHero:', {
      mobsKilled: (fixedHero as any).mobsKilled,
      heroJsonMobsKilled: (fixedHero as any).heroJson?.mobsKilled,
    });
    
    // 🔥 Схема A: hero.* - єдине джерело істини
    // Skills вже об'єднані в finalSkillsForRecalc; використовуємо їх для фінального героя
    const localMobsKilled = (hydratedLocalHero as any)?.mobsKilled ?? 0;
    const serverMobsKilled = mobsKilledFromData ?? 0;
    const finalSkills = finalSkillsForRecalc;
    const finalMobsKilled = localMobsKilled > serverMobsKilled ? localMobsKilled : (serverMobsKilled > 0 ? serverMobsKilled : currentMobsKilled);
    
    // Щоденні завдання: зберігаємо з hero (сервер або локаль), щоб не втрачати прогрес
    const dailyQuestsProgress = (fixedHero as any).dailyQuestsProgress ?? (heroData as any)?.dailyQuestsProgress ?? hydratedLocalHero?.dailyQuestsProgress;
    const dailyQuestsCompleted = (fixedHero as any).dailyQuestsCompleted ?? (heroData as any)?.dailyQuestsCompleted ?? hydratedLocalHero?.dailyQuestsCompleted;
    const dailyQuestsResetDate = (fixedHero as any).dailyQuestsResetDate ?? (heroData as any)?.dailyQuestsResetDate ?? hydratedLocalHero?.dailyQuestsResetDate;

    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      baseStats: recalculated.originalBaseStats,
      baseStatsInitial: fixedHero.baseStatsInitial || recalculated.originalBaseStats,
      battleStats: recalculated.baseFinalStats,
      maxHp: finalMaxHp,
      maxMp: finalMaxMp,
      maxCp: finalMaxCp,
      hp: finalHp,
      mp: finalMp,
      cp: finalCp,
      skills: finalSkills,
      equipment: mergedEquipment,
      inventory: mergedInventory,
      mobsKilled: finalMobsKilled as any,
      // Адмін: блок/бан — показуємо екран або блокуємо чат
      ...((character as any).blockedUntil ? { blockedUntil: (character as any).blockedUntil } : {}),
      ...((character as any).bannedUntil ? { bannedUntil: (character as any).bannedUntil } : {}),
      // Щоденні завдання — щоб працювали після завантаження з API
      ...(dailyQuestsProgress !== undefined ? { dailyQuestsProgress } : {}),
      ...(dailyQuestsCompleted !== undefined ? { dailyQuestsCompleted } : {}),
      ...(dailyQuestsResetDate !== undefined ? { dailyQuestsResetDate } : {}),
    };
    (heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
    (heroWithRecalculatedStats as any).baseMaxMp = recalculated.resources.maxMp;
    (heroWithRecalculatedStats as any).baseMaxCp = recalculated.resources.maxCp;
    // 🔥 Зберігаємо повний heroJson з сервера; при isDead — бафи пусті; при preferLocalAlive — зберігаємо оживлення
    const loadedHeroJson = heroData || (fixedHero as any).heroJson || {};
    (heroWithRecalculatedStats as any).heroJson = {
      ...loadedHeroJson,
      ...(preferLocalAlive ? { isDead: false, deadAt: 0 } : {}),
      heroBuffs: isDead ? [] : (loadedHeroJson.heroBuffs ?? finalBuffs),
    };
    
    // 🔥 Правило 2: Використовуємо hydrateHero для синхронізації heroJson
    const hydratedHero = hydrateHero(heroWithRecalculatedStats);
    
    // Додаємо heroBuffs до heroJson (вони не в hydrateHero, бо це окрема логіка)
    // 🔥 КРИТИЧНО: Зберігаємо heroRevision з сервера для optimistic locking
    // 🔥 hero.id = character.id для reportMedalDrop/reportRaidBossKill тощо
    if (hydratedHero) {
      (hydratedHero as any).id = character.id;
      (hydratedHero as any).heroRevision = (heroData as any)?.heroRevision || (character as any)?.heroRevision || undefined;
      
      // 🔥 КРИТИЧНО: Синхронізуємо heroBuffs в heroJson; при isDead — бафи пусті
      (hydratedHero as any).heroJson = {
        ...(hydratedHero as any).heroJson,
        heroBuffs: isDead ? [] : savedBuffs,
      };
      
      // 🔥 Логуємо для діагностики
      console.log('[loadHeroFromAPI] Hero loaded with buffs:', {
        heroJsonBuffs: heroJsonBuffs.length,
        savedBattleBuffs: savedBattleBuffs.length,
        uniqueBuffs: savedBuffs.length,
        buffNames: savedBuffs.map((b: any) => b.name || b.id).slice(0, 5),
      });

      // 🔥 КРИТИЧНО: Преміум + Coin of Luck — беремо з локального, якщо там новіший преміум (після покупки F5 не має відкатувати)
      if (hydratedLocalHero) {
        const localPremiumUntil = (hydratedLocalHero as any).premiumUntil ?? (hydratedLocalHero as any).heroJson?.premiumUntil;
        const serverPremiumUntil = (hydratedHero as any).premiumUntil ?? (hydratedHero as any).heroJson?.premiumUntil;
        if (localPremiumUntil != null && Number(localPremiumUntil) > Number(serverPremiumUntil || 0)) {
          (hydratedHero as any).premiumUntil = localPremiumUntil;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, premiumUntil: localPremiumUntil };
          // Після покупки преміуму коіни вже зняті локально — не перезаписувати серверним значенням
          const localCoinOfLuck = (hydratedLocalHero as any).coinOfLuck ?? (hydratedLocalHero as any).heroJson?.coinOfLuck;
          if (localCoinOfLuck !== undefined && localCoinOfLuck !== null) {
            (hydratedHero as any).coinOfLuck = localCoinOfLuck;
            (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, coinOfLuck: localCoinOfLuck };
          }
        }
      }
      // 🔥 КРИТИЧНО: Якщо локально більше предметів/екіпу — беремо з локального героя, щоб не втрачати покупки після F5
      if (hydratedLocalHero) {
        const localInv = hydratedLocalHero.inventory ?? [];
        const serverInv = hydratedHero.inventory ?? [];
        const localEquip = hydratedLocalHero.equipment ?? {};
        const serverEquip = hydratedHero.equipment ?? {};
        const localInvLen = Array.isArray(localInv) ? localInv.length : 0;
        const serverInvLen = Array.isArray(serverInv) ? serverInv.length : 0;
        const localEquipCount = Object.keys(localEquip).filter((k) => localEquip[k] != null).length;
        const serverEquipCount = Object.keys(serverEquip).filter((k) => serverEquip[k] != null).length;
        if (localInvLen > serverInvLen) {
          (hydratedHero as any).inventory = localInv;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, inventory: localInv };
          if (hydratedLocalHero.adena !== undefined && hydratedLocalHero.adena !== null) {
            (hydratedHero as any).adena = hydratedLocalHero.adena;
            (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, adena: hydratedLocalHero.adena };
          }
          console.log('[loadHeroFromAPI] Preferring local inventory (more items):', localInvLen, 'vs', serverInvLen);
        }
        if (localEquipCount > serverEquipCount) {
          (hydratedHero as any).equipment = localEquip;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, equipment: localEquip };
          console.log('[loadHeroFromAPI] Preferring local equipment (more slots):', localEquipCount, 'vs', serverEquipCount);
        }
      }
    }
    
    // Логуємо фінальні дані для діагностики
    if (hydratedHero) {
      // 🔥 КРИТИЧНО: Оновлюємо serverState в store після GET
      // Це запобігає помилці "exp cannot be decreased" та "sp cannot be decreased" при наступному save
      const { useHeroStore } = await import('../heroStore');
      const char = character as any;
      useHeroStore.getState().updateServerState({
        exp: hydratedHero.exp ?? 0,
        level: hydratedHero.level ?? 1,
        sp: hydratedHero.sp ?? 0,
        coinLuck: char?.coinLuck ?? hydratedHero.coinOfLuck ?? 0,
        heroRevision: (hydratedHero as any).heroRevision,
        updatedAt: Date.now(),
      });
      
      console.log('[loadHeroFromAPI] Final hero after hydration:', {
        skillsCount: hydratedHero.skills?.length || 0,
        mobsKilled: (hydratedHero as any).mobsKilled,
        level: hydratedHero.level,
        exp: hydratedHero.exp,
        inventoryCount: hydratedHero.inventory?.length || 0,
        serverState: useHeroStore.getState().serverState,
      });
    }

    // ❗ ВАЖЛИВО: НЕ перезаписуємо heroJson, якщо він вже існує!
    // Якщо heroJson був порожній і ми створили нового героя - зберігаємо його в базу
    // Але ТІЛЬКИ якщо heroJson дійсно порожній (не має важливих полів)
    const wasEmpty = !heroData || typeof heroData !== 'object' || Object.keys(heroData).length === 0;
    if (wasEmpty && hydratedHero) {
      console.log('[loadHeroFromAPI] heroJson was empty, saving new hero to database');
      // Зберігаємо створеного героя в базу даних (асинхронно, не блокуємо)
      updateCharacter(character.id, {
        heroJson: (hydratedHero as any).heroJson,
      }).then(() => {
        console.log('[loadHeroFromAPI] Created hero saved to database');
      }).catch((error) => {
        console.error('[loadHeroFromAPI] Failed to save created hero to database:', error);
      });
    } else {
      console.log('[loadHeroFromAPI] heroJson exists, NOT overwriting with new hero');
    }

    return hydratedHero || heroWithRecalculatedStats;
  } catch (error) {
    console.error('[loadHeroFromAPI] Failed to load hero from API:', error);
    console.warn('[loadHeroFromAPI] Returning null - will fallback to localStorage');
    // Повертаємо null, щоб App.tsx міг використати fallback на localStorage
    return null;
  }
}
