// Async function to load hero from API
import { getCharacter, updateCharacter, sendHeartbeat } from "../../utils/api";
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

  try {
    // 🔥 Правило 1: Local-first старт - завантажуємо локальну версію спочатку
    const localHero = loadHero();
    const hydratedLocalHero = hydrateHero(localHero);
    
    // Load character from API
    console.log('[loadHeroFromAPI] Fetching character from API...');
    const character = await getCharacter(characterStore.characterId);
    console.log('[loadHeroFromAPI] Character received:', character ? 'success' : 'null', character?.id);
    
    // 🔥 Правило 1: Перевіряємо, чи локальна версія має новіші дані (skills/mobsKilled/exp/level)
    // Якщо так - не перетираємо локальні зміни (щоб після F5 не втратити level up)
    if (character && hydratedLocalHero) {
      const heroData = character.heroJson as any;
      const serverSkills = Array.isArray(heroData?.skills) ? heroData.skills.length : 0;
      const localSkills = Array.isArray(hydratedLocalHero.skills) ? hydratedLocalHero.skills.length : 0;
      const serverMobsKilled = heroData?.mobsKilled ?? 0;
      const localMobsKilled = (hydratedLocalHero as any).mobsKilled ?? 0;
      const serverExp = Number(character.exp ?? heroData?.exp ?? 0);
      const localExp = hydratedLocalHero.exp ?? 0;
      const serverLevel = character.level ?? heroData?.level ?? 1;
      const localLevel = hydratedLocalHero.level ?? 1;
      
      // 🔥 КРИТИЧНО: Якщо локальна версія має більше exp/level/skills/mobsKilled - не перетираємо
      const localHasMoreProgress =
        localExp > serverExp ||
        localLevel > serverLevel ||
        localSkills > serverSkills ||
        localMobsKilled > serverMobsKilled;
      
      if (localHasMoreProgress) {
        console.warn('[loadHeroFromAPI] Local version has more progress (local level:', localLevel, 'exp:', localExp, 'server level:', serverLevel, 'exp:', serverExp, 'skills:', localSkills, '/', serverSkills, 'mobs:', localMobsKilled, '/', serverMobsKilled, '), keeping local version');
        // Використовуємо локальну версію і одразу пушимо на сервер у фоні
        import('./heroPersistence').then(({ saveHeroToLocalStorage }) => {
          saveHeroToLocalStorage(hydratedLocalHero).catch((err: any) => {
            console.warn('[loadHeroFromAPI] Background push of local hero failed:', err?.message || err);
          });
        });
        return hydratedLocalHero;
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
    
    // 🔥 Оновлюємо активність при завантаженні героя (асинхронно, не блокуємо)
    // 🔥 Ігноруємо помилки heartbeat - вони не критичні (можливо міграція не виконана)
    if (character) {
      sendHeartbeat().catch((err: any) => {
        if (err?.status === 400 || err?.status === 404 || err?.status === 500) {
          console.warn('[loadHeroFromAPI] Heartbeat failed (non-critical):', err?.message);
        } else {
          console.error('[loadHeroFromAPI] Failed to send heartbeat:', err);
        }
      });
    }
    
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
    
    // Логуємо інвентар при завантаженні
    if (heroData?.inventory) {
      console.log('[loadHeroFromAPI] Inventory found in heroJson:', {
        count: heroData.inventory.length,
        items: heroData.inventory.map((i: any) => ({ id: i.id, count: i.count }))
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
      
      fixedHero = fixHeroProfession({
        ...heroData,
        // Override with character data (these are the source of truth)
        // 🔥 КРИТИЧНО: Використовуємо більше значення рівня та exp, щоб не втратити прогрес
        level: finalLevel,
        exp: finalExp, // Convert BigInt to number
        sp: character.sp,
        adena: character.adena,
        coinOfLuck: character.coinLuck,
        aa: character.aa || 0,
        // Ensure required fields
        name: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
        // 🔥 Схема A: hero.skills, hero.mobsKilled - офіційні поля
        skills: (heroData as any).skills || fixedHero.skills || [],
        mobsKilled: finalMobsKilled as any,
      } as Hero);
    }

    // Recalculate stats (same logic as localStorage version)
    const now = Date.now();
    const savedBattle = loadBattle(fixedHero.name);
    
    // 🔥 КРИТИЧНО: Бафи можуть бути в heroJson.heroBuffs (з сервера) або в savedBattle.heroBuffs (localStorage)
    // Перевіряємо обидва джерела і об'єднуємо їх
    const heroJsonBuffs = Array.isArray((fixedHero as any).heroJson?.heroBuffs) 
      ? (fixedHero as any).heroJson.heroBuffs 
      : [];
    const savedBattleBuffs = savedBattle?.heroBuffs || [];
    
    // Об'єднуємо бафи з обох джерел (уникаємо дублікатів за id)
    const allBuffs = [...heroJsonBuffs, ...savedBattleBuffs];
    const uniqueBuffs = allBuffs.filter((buff, index, self) => 
      index === self.findIndex((b) => 
        (b.id && buff.id && b.id === buff.id) || 
        (!b.id && !buff.id && b.name === buff.name)
      )
    );
    
    const savedBuffs = cleanupBuffs(uniqueBuffs, now);
    const recalculated = recalculateAllStats(fixedHero, []);

    const baseMax = {
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
    };
    const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);

    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;

    const finalHp =
      fixedHero.hp === undefined ||
      fixedHero.hp <= 0 ||
      fixedHero.hp >= finalMaxHp
        ? finalMaxHp
        : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));

    const finalMp =
      fixedHero.mp === undefined ||
      fixedHero.mp <= 0 ||
      fixedHero.mp >= finalMaxMp
        ? finalMaxMp
        : Math.min(finalMaxMp, Math.max(fixedHero.mp, 0));

    const finalCp =
      fixedHero.cp === undefined ||
      fixedHero.cp <= 0 ||
      fixedHero.cp >= finalMaxCp
        ? finalMaxCp
        : Math.min(finalMaxCp, Math.max(fixedHero.cp, 0));

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
    // Встановлюємо skills/mobsKilled з heroJson (при завантаженні з сервера)
    // Але якщо локальна версія має більше - використовуємо локальну
    const localSkills = hydratedLocalHero?.skills || [];
    const localMobsKilled = (hydratedLocalHero as any)?.mobsKilled ?? 0;
    const serverSkills = Array.isArray((heroData as any)?.skills) ? (heroData as any).skills : [];
    const serverMobsKilled = mobsKilledFromData ?? 0;
    
    // 🔥 Використовуємо більше значення (local або server)
    const finalSkills = localSkills.length > serverSkills.length ? localSkills : (serverSkills.length > 0 ? serverSkills : (fixedHero.skills || []));
    const finalMobsKilled = localMobsKilled > serverMobsKilled ? localMobsKilled : (serverMobsKilled > 0 ? serverMobsKilled : currentMobsKilled);
    
    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      baseStats: recalculated.originalBaseStats,
      baseStatsInitial: fixedHero.baseStatsInitial || recalculated.originalBaseStats,
      battleStats: recalculated.finalStats,
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
      hp: finalHp,
      mp: finalMp,
      cp: finalCp,
      // 🔥 Схема A: hero.skills, hero.mobsKilled - офіційні поля
      skills: finalSkills,
      mobsKilled: finalMobsKilled as any,
    };
    
    // 🔥 Правило 2: Використовуємо hydrateHero для синхронізації heroJson
    const hydratedHero = hydrateHero(heroWithRecalculatedStats);
    
    // Додаємо heroBuffs до heroJson (вони не в hydrateHero, бо це окрема логіка)
    // 🔥 КРИТИЧНО: Зберігаємо heroRevision з сервера для optimistic locking
    if (hydratedHero) {
      (hydratedHero as any).heroRevision = (heroData as any)?.heroRevision || (character as any)?.heroRevision || undefined;
      
      // 🔥 КРИТИЧНО: Синхронізуємо heroBuffs в heroJson
      // Бафи можуть бути в heroJson.heroBuffs (з сервера) або в savedBattle.heroBuffs (localStorage)
      // Використовуємо об'єднані savedBuffs (вже оброблені через cleanupBuffs)
      (hydratedHero as any).heroJson = {
        ...(hydratedHero as any).heroJson,
        heroBuffs: savedBuffs, // 🔥 КРИТИЧНО: Зберігаємо бафи в heroJson для збереження на сервері
      };
      
      // 🔥 Логуємо для діагностики
      console.log('[loadHeroFromAPI] Hero loaded with buffs:', {
        heroJsonBuffs: heroJsonBuffs.length,
        savedBattleBuffs: savedBattleBuffs.length,
        uniqueBuffs: savedBuffs.length,
        buffNames: savedBuffs.map((b: any) => b.name || b.id).slice(0, 5),
      });
    }
    
    // Логуємо фінальні дані для діагностики
    if (hydratedHero) {
      // 🔥 КРИТИЧНО: Оновлюємо serverState в store після GET
      // Це запобігає помилці "exp cannot be decreased" та "sp cannot be decreased" при наступному save
      const { useHeroStore } = await import('../heroStore');
      useHeroStore.getState().updateServerState({
        exp: hydratedHero.exp ?? 0,
        level: hydratedHero.level ?? 1,
        sp: hydratedHero.sp ?? 0, // 🔥 Додано SP
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
