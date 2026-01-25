import type { Hero } from "../../types/Hero";
import { updateCharacter } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { getJSON, setJSON } from "../persistence"; // Fallback for localStorage

// Try to save via API, fallback to localStorage if not authenticated
export async function saveHeroToLocalStorage(hero: Hero): Promise<void> {
  // ❗ ВАЖЛИВО: Перевіряємо, чи hero не порожній перед збереженням
  if (!hero || !hero.name) {
    console.error('[saveHeroToLocalStorage] Attempted to save empty or invalid hero!', hero);
    return;
  }
  
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

  // If not authenticated, use localStorage (backward compatibility)
  if (!authStore.isAuthenticated || !characterStore.characterId) {
    const current = getJSON<string | null>("l2_current_user", null);
    if (!current) return;

    const accounts = getJSON<any[]>("l2_accounts_v2", []);
    const accIndex = accounts.findIndex((a: any) => a.username === current);
    if (accIndex !== -1) {
      accounts[accIndex].hero = hero;
      setJSON("l2_accounts_v2", accounts);
    }
    return;
  }

  // Save via API
  try {
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
    
    // 🔥 Optimistic locking: передаємо поточну ревізію, якщо вона є
    const expectedRevision = (hero as any).heroRevision;
    
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
    const existingHeroJson = (hero as any).heroJson || {};
    
    // Логуємо mobsKilled для діагностики (завжди, не тільки в DEV)
    console.log('[saveHeroToLocalStorage] mobsKilled to save:', currentMobsKilled, 'from hero:', {
      mobsKilled: (hero as any).mobsKilled,
      heroJsonMobsKilled: (hero as any).heroJson?.mobsKilled,
    });
    
    // 🔥 КРИТИЧНО: НЕ копіюємо весь hero в heroJson, бо це створить циклічну структуру!
    // Копіюємо тільки необхідні поля з hero, виключаючи heroJson
    const { heroJson: _, ...heroWithoutJson } = hero as any;
    
    // 🔥 КРИТИЧНО: Бафи можуть бути в heroJson.heroBuffs або в battle state
    // Перевіряємо обидва джерела
    const loadBattle = require("../battle/persist").loadBattle;
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
    
    const heroJsonToSave = {
      ...existingHeroJson, // Спочатку беремо існуючий heroJson
      ...heroWithoutJson, // Потім додаємо поля з hero (БЕЗ heroJson, щоб уникнути циклу)
      // 🔥 КРИТИЧНО: mobsKilled, level, exp, heroBuffs завжди мають бути в heroJson
      mobsKilled: currentMobsKilled,
      level: hero.level, // Гарантуємо, що level є в heroJson
      exp: hero.exp, // Гарантуємо, що exp є в heroJson
      heroBuffs: uniqueBuffs, // 🔥 КРИТИЧНО: Зберігаємо бафи в heroJson
    };
    
    // Логуємо для діагностики
    console.log('[saveHeroToLocalStorage] heroJsonToSave:', {
      mobsKilled: heroJsonToSave.mobsKilled,
      level: heroJsonToSave.level,
      exp: heroJsonToSave.exp,
      heroBuffsCount: uniqueBuffs.length,
    });
    
    await updateCharacter(characterStore.characterId, {
      heroJson: heroJsonToSave,
      level: hero.level,
      exp: hero.exp,
      sp: hero.sp,
      adena: hero.adena,
      aa: hero.aa || 0,
      coinLuck: hero.coinOfLuck || 0,
      expectedRevision, // Передаємо для optimistic locking
    });
    console.log('[saveHeroToLocalStorage] Hero saved successfully via API');
    
    // ❗ ВАЖЛИВО: Також зберігаємо в localStorage як backup (навіть якщо API працює)
    // Це гарантує, що дані не втрачаться при проблемах з API
    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      const accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex !== -1) {
        // Додаємо lastSavedAt для синхронізації
        // 🔥 ВАЖЛИВО: mobsKilled має бути в heroJson, тому додаємо його
        const mobsKilled = (hero as any).mobsKilled ?? (hero as any).mobs_killed ?? (hero as any).killedMobs ?? (hero as any).totalKills ?? 0;
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
          // 🔥 Додаємо mobsKilled в heroJson для збереження в localStorage
          heroJson: {
            ...((hero as any).heroJson || {}),
            mobsKilled: mobsKilled,
          },
        };
        accounts[accIndex].hero = heroWithTimestamp;
        setJSON("l2_accounts_v2", accounts);
        console.log('[saveHeroToLocalStorage] Also saved to localStorage as backup, mobsKilled:', mobsKilled);
      }
    }
  } catch (error: any) {
    // 🔥 Обробка rate limiting (429 Too Many Requests)
    if (error?.status === 429 || (error?.message && (error.message.includes('rate_limit') || error.message.includes('Too Many Requests')))) {
      console.warn('[saveHeroToLocalStorage] Rate limit exceeded, saving to localStorage and will retry later');
      
      // Зберігаємо в localStorage як backup
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          const mobsKilled = (hero as any).mobsKilled ?? (hero as any).mobs_killed ?? (hero as any).killedMobs ?? (hero as any).totalKills ?? 0;
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            _rateLimitBackup: true, // Позначаємо як backup через rate limit
            heroJson: {
              ...((hero as any).heroJson || {}),
              mobsKilled: mobsKilled,
            },
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
          console.log('[saveHeroToLocalStorage] Saved to localStorage due to rate limit, mobsKilled:', mobsKilled);
        }
      }
      
      // Не кидаємо помилку - дані збережені в localStorage
      return;
    }
    
    // 🔥 Обробка конфлікту ревізії (409 Conflict)
    if (error?.status === 409 || (error?.message && error.message.includes('revision_conflict'))) {
      console.warn('[saveHeroToLocalStorage] Revision conflict detected - character was modified by another session');
      
      // ❗ ВАЖЛИВО: НЕ робимо force overwrite! Зберігаємо локальну версію як backup
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          // Зберігаємо локальну версію як backup перед заміною
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            _conflictBackup: true, // Позначаємо як backup через конфлікт
            _conflictServerState: error.details?.serverState || null,
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
          console.warn('[saveHeroToLocalStorage] Local version saved as backup due to 409 conflict');
        }
      }
      
      // ❗ НЕ робимо автоматичний force overwrite - вимагаємо перезавантаження
      throw new Error('Character was modified by another session. Please reload the page to get the latest version.');
    }
    
    console.error('[saveHeroToLocalStorage] Failed to save hero via API:', error);
    console.warn('[saveHeroToLocalStorage] Falling back to localStorage (API недоступний)');
    
    // Fallback to localStorage on error - ВАЖЛИВО для збереження даних!
    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      const accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex !== -1) {
        // Додаємо lastSavedAt для синхронізації
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
        };
        accounts[accIndex].hero = heroWithTimestamp;
        setJSON("l2_accounts_v2", accounts);
        console.log('[saveHeroToLocalStorage] Saved to localStorage (fallback)');
      }
    }
  }
}
