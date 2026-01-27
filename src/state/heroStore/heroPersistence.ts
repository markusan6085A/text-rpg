import type { Hero } from "../../types/Hero";
import { updateCharacter, getCharacter } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { getJSON, setJSON } from "../persistence"; // Fallback for localStorage
import { loadBattle } from "../battle/persist";
import { hydrateHero } from "./heroHydration";

// 🔥 КРИТИЧНО: Глобальний "save mutex" для серіалізації збережень
// Запобігає паралельним збереженням, які викликають revision_conflict
let saving = false;
let queued = false; // Прапорець, що є зміни для збереження (не snapshot!)
let retryCount = 0;
const MAX_RETRIES = 1; // Максимум 1 автоматичний retry при revision_conflict

// 🔥 ВИДАЛЕНО: Глобальні змінні lastServerExp/lastServerLevel та window.__lastServerExp
// Тепер використовуємо serverState з heroStore

// Try to save via API, fallback to localStorage if not authenticated
export async function saveHeroToLocalStorage(hero: Hero): Promise<void> {
  // ❗ ВАЖЛИВО: Перевіряємо, чи hero не порожній перед збереженням
  if (!hero || !hero.name) {
    console.error('[saveHeroToLocalStorage] Attempted to save empty or invalid hero!', hero);
    return;
  }
  
  // 🔥 КРИТИЧНО: Серіалізуємо збереження - якщо вже йде save, ставимо прапорець
  if (saving) {
    console.log('[saveHeroToLocalStorage] Save already in progress, marking as queued');
    queued = true; // Прапорець, що є зміни (не snapshot!)
    return;
  }
  
  // Встановлюємо флаг, що save йде
  saving = true;
  retryCount = 0;
  
  try {
    await saveHeroOnce(hero);
  } finally {
    saving = false;
    
    // 🔥 КРИТИЧНО: Якщо була черга - беремо АКТУАЛЬНОГО героя зі store (не snapshot!)
    // Це гарантує, що не втратимо зміни, які відбулися під час save
    if (queued) {
      queued = false;
      console.log('[saveHeroToLocalStorage] Processing queued save - getting current hero from store');
      // Викликаємо асинхронно, щоб не блокувати
      setTimeout(async () => {
        try {
          const { useHeroStore } = await import('../heroStore');
          const currentHero = useHeroStore.getState().hero;
          if (currentHero) {
            // Беремо актуального героя зі store, а не snapshot
            await saveHeroToLocalStorage(currentHero);
          }
        } catch (err) {
          console.error('[saveHeroToLocalStorage] Failed to save queued hero:', err);
        }
      }, 100);
    }
  }
}

// Внутрішня функція для одного збереження
async function saveHeroOnce(hero: Hero): Promise<void> {
  // 🔥 Правило 2: Використовуємо hydrateHero перед збереженням для гарантованої синхронізації
  const hydrated = hydrateHero(hero);
  if (!hydrated) {
    console.error('[saveHeroToLocalStorage] Failed to hydrate hero!');
    return;
  }
  
  // Використовуємо hydrated hero для збереження
  hero = hydrated;
  
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
    
    // 🔥 КРИТИЧНО: Завжди робимо MERGE з існуючим heroJson, щоб не втратити дані
    // Ніколи не перезаписуємо heroJson об'єктом, який містить тільки skills/mobsKilled/buffs
    const existingHeroJson = (hero as any).heroJson ?? {};
    
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
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          accounts[accIndex].hero = hero;
          setJSON("l2_accounts_v2", accounts);
          console.warn('[saveHeroToLocalStorage] Saved to localStorage only (missing required fields)');
        }
      }
      return;
    }
    
    // 🔥 MERGE: зберігаємо всі існуючі поля + оновлюємо прогрес
    const heroJsonToSave = {
      ...existingHeroJson, // 🔥 КРИТИЧНО: Зберігаємо всі існуючі поля з heroJson
      
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
      mobsKilled: Number(currentMobsKilled),
      skills: Array.isArray(hero.skills) ? hero.skills : (Array.isArray(existingHeroJson.skills) ? existingHeroJson.skills : []),
      heroBuffs: Array.isArray(uniqueBuffs) ? uniqueBuffs : [],
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
    
    // 🔥 Отримуємо останні серверні значення з store (замість window/глобальних змінних)
    const { useHeroStore } = await import('../heroStore');
    const serverState = useHeroStore.getState().serverState;
    const serverExpKnown = serverState?.exp ?? null;
    const serverLevelKnown = serverState?.level ?? null;
    const serverSpKnown = serverState?.sp ?? null; // 🔥 Додано SP
    
    // 🔥 Clamp ТІЛЬКИ для exp та sp (і mobsKilled) - level беремо з сервера як source of truth
    // Якщо level залежить від exp, то "максимальний level" може зробити стан неконсистентним
    // Краще правило: clamp робити тільки для exp та sp, а level хай приходить з сервера як істина
    const expToSend = serverExpKnown !== null ? Math.max(localExp, serverExpKnown) : localExp;
    // 🔥 КРИТИЧНО: SP також clamp'имо - не дозволяємо зменшувати SP нижче серверного значення
    // Це запобігає помилці "sp cannot be decreased" при вивченні скілів
    const spToSend = serverSpKnown !== null ? Math.max(localSp, serverSpKnown) : localSp;
    // 🔥 ВАЖЛИВО: level НЕ clamp'имо - беремо з сервера як source of truth
    // Якщо сервер приймає level як похідне від exp - він сам перерахує
    // Якщо сервер приймає level як незалежне поле - передаємо локальне, але сервер перевірить
    const levelToSend = localLevel; // Не clamp'имо level - сервер є source of truth
    
    console.log('[saveHeroToLocalStorage] Sending exp/level/sp:', {
      localExp,
      localLevel,
      localSp,
      serverExpKnown,
      serverLevelKnown,
      serverSpKnown,
      expToSend,
      levelToSend,
      spToSend,
      expClamped: expToSend !== localExp,
      spClamped: spToSend !== localSp,
      levelFromServer: serverLevelKnown !== null,
    });
    
    const updatedCharacter = await updateCharacter(characterStore.characterId, {
      heroJson: heroJsonToSave,
      level: levelToSend,
      exp: expToSend, // 🔥 Використовуємо clamped exp
      sp: spToSend, // 🔥 Використовуємо clamped sp (замість hero.sp)
      adena: hero.adena,
      aa: hero.aa || 0,
      coinLuck: hero.coinOfLuck || 0,
      expectedRevision, // Передаємо для optimistic locking
    });
    console.log('[saveHeroToLocalStorage] Hero saved successfully via API');
    
    // 🔥 КРИТИЧНО: Після успішного PATCH оновлюємо heroRevision, exp, level, sp у store
    // Це запобігає наступним revision_conflict та "exp cannot be decreased" / "sp cannot be decreased"
    if (updatedCharacter) {
      const newRevision = (updatedCharacter as any).heroRevision || (updatedCharacter as any).revision;
      const serverExp = Number(updatedCharacter.exp ?? 0);
      const serverLevel = Number(updatedCharacter.level ?? 1);
      const serverSp = Number(updatedCharacter.sp ?? 0); // 🔥 Додано SP
      
      // 🔥 Оновлюємо serverState в store (замість глобальних змінних та window)
      const { useHeroStore } = await import('../heroStore');
      useHeroStore.getState().updateServerState({
        exp: serverExp,
        level: serverLevel,
        sp: serverSp, // 🔥 Додано SP
        heroRevision: newRevision,
        updatedAt: Date.now(),
      });
      
      // 🔥 Оновлюємо hero в store: exp/sp clamp'имо, level беремо з сервера як source of truth
      const currentHero = useHeroStore.getState().hero;
      if (currentHero) {
        // Clamp exp - беремо більше значення (захист від зменшення)
        const clampedExp = Math.max(currentHero.exp ?? 0, serverExp);
        // Clamp sp - беремо більше значення (захист від зменшення)
        const clampedSp = Math.max(currentHero.sp ?? 0, serverSp);
        // Level беремо з сервера як source of truth (не clamp'имо)
        useHeroStore.getState().updateHero({
          heroRevision: newRevision,
          exp: clampedExp,
          sp: clampedSp, // 🔥 Додано SP
          level: serverLevel, // 🔥 Level з сервера - source of truth
        } as any);
        console.log('[saveHeroToLocalStorage] Updated heroRevision, exp, level, sp in store:', {
          revision: newRevision,
          exp: clampedExp,
          sp: clampedSp,
          level: serverLevel,
          serverState: useHeroStore.getState().serverState,
        });
      }
    }
    
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
      
      // 🔥 КРИТИЧНО: Повідомляємо heroStore про rate limit для встановлення cooldown
      // Це запобігає подальшим спробам збереження протягом cooldown періоду
      try {
        const { setRateLimitCooldown } = await import('../heroStore');
        setRateLimitCooldown(60000); // 60 секунд cooldown
      } catch (e) {
        console.error('[saveHeroToLocalStorage] Failed to set rate limit cooldown:', e);
      }
      
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
    
    // 🔥 Обробка конфлікту ревізії (409 Conflict або revision_conflict)
    if (error?.status === 409 || (error?.message && (error.message.includes('revision_conflict') || error.message.includes('revision conflict')))) {
      console.warn('[saveHeroToLocalStorage] Revision conflict detected - character was modified by another session');
      
      // 🔥 КРИТИЧНО: Автоматично "rehydrate + retry один раз"
      // Правильний UX: користувач навіть не помітить конфлікт
      // 🔥 ВАЖЛИВО: Перевіряємо лічильник, щоб не створити цикл
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`[saveHeroToLocalStorage] Attempting automatic retry ${retryCount}/${MAX_RETRIES} after revision conflict...`);
        
        try {
          // 1. Отримуємо актуального героя з сервера (GET /characters/:id)
          const characterStore = useCharacterStore.getState();
          const currentCharacter = await getCharacter(characterStore.characterId);
          
          if (currentCharacter) {
            // 2. Мержимо локальні дельти (exp/mobsKilled/skills/buffs) з серверним станом
            const serverHeroJson = currentCharacter.heroJson || {};
            const localMobsKilled = (hero as any).mobsKilled ?? 0;
            const serverMobsKilled = serverHeroJson.mobsKilled ?? 0;
            const localExp = hero.exp ?? 0;
            const serverExp = serverHeroJson.exp ?? Number(currentCharacter.exp) ?? 0;
            const localSkills = hero.skills ?? [];
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
            const savedBattle = loadBattle(hero.name);
            const battleBuffs = savedBattle?.heroBuffs || [];
            const serverBuffs = Array.isArray(serverHeroJson.heroBuffs) ? serverHeroJson.heroBuffs : [];
            const localBuffs = Array.isArray((hero as any).heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs : [];
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
            const { useHeroStore } = await import('../heroStore');
            const currentHero = useHeroStore.getState().hero;
            if (currentHero) {
              const newRevision = (currentCharacter as any).heroRevision || (currentCharacter as any).revision;
              const serverLevel = Number(currentCharacter.level ?? 1);
              
              // 🔥 Оновлюємо serverState після GET (перед retry)
              const serverSp = Number(currentCharacter.sp ?? 0); // 🔥 Додано SP
              useHeroStore.getState().updateServerState({
                exp: mergedExp, // Використовуємо merged exp (більше значення)
                level: serverLevel, // Level з сервера - source of truth
                sp: serverSp, // 🔥 Додано SP
                heroRevision: newRevision,
                updatedAt: Date.now(),
              });
              
              const mergedHero = {
                ...currentHero,
                exp: mergedExp,
                level: serverLevel, // 🔥 Level з сервера - source of truth
                mobsKilled: mergedMobsKilled as any,
                skills: mergedSkills,
                heroRevision: newRevision,
                heroJson: {
                  ...(currentHero as any).heroJson,
                  ...serverHeroJson,
                  exp: mergedExp,
                  mobsKilled: mergedMobsKilled,
                  skills: mergedSkills,
                  heroBuffs: cleanedBuffs,
                },
              };
              
              // Оновлюємо store
              useHeroStore.getState().setHero(mergedHero);
              console.log('[saveHeroToLocalStorage] Hero rehydrated and merged, retrying save with revision:', newRevision);
              
              // 4. Повторюємо збереження з актуальною ревізією
              // Використовуємо saveHeroOnce напряму, щоб не збільшувати retryCount
              await saveHeroOnce(mergedHero);
              console.log('[saveHeroToLocalStorage] Successfully saved after retry');
              return; // Успішно збережено після retry
            }
          }
        } catch (reloadError: any) {
          console.error('[saveHeroToLocalStorage] Failed to reload and retry after revision conflict:', reloadError);
          
          // 🔥 КРИТИЧНО: Якщо retry теж отримав 409 - показуємо попередження і зупиняємося
          if (reloadError?.status === 409 || (reloadError?.message && reloadError.message.includes('revision_conflict'))) {
            console.error('[saveHeroToLocalStorage] Retry also failed with revision_conflict - stopping auto-retry');
            // Можна показати toast/notification користувачу: "Оновіть сторінку"
            if (typeof window !== 'undefined' && window.alert) {
              window.alert('Конфлікт версій персонажа. Будь ласка, оновіть сторінку (F5) для синхронізації.');
            }
          }
          
          retryCount = MAX_RETRIES; // Не намагаємося більше
        }
      } else {
        // 🔥 КРИТИЧНО: Якщо досягнуто максимум retry - показуємо попередження
        console.error('[saveHeroToLocalStorage] Maximum retries reached, stopping auto-retry');
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Не вдалося зберегти дані через конфлікт версій. Будь ласка, оновіть сторінку (F5).');
        }
      }
      
      // Якщо retry не вдався або досягнуто максимум - зберігаємо локальну версію як backup
      console.warn('[saveHeroToLocalStorage] Revision conflict - saving to localStorage as backup');
      
      // Якщо перезавантаження не вдалося - зберігаємо локальну версію як backup
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
      
      // Не викидаємо помилку - дані збережені в localStorage
      console.warn('[saveHeroToLocalStorage] 409 conflict handled, data saved to localStorage');
      return;
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
