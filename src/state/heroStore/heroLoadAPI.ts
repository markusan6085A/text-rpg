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
import { EXP_TABLE, getExpToNext, MAX_LEVEL } from "../../data/expTable";

// 🔥 ВИДАЛЕНО: window.__lastServerExp та глобальні змінні
// Тепер використовуємо serverState з heroStore

function normalizeExpToLevelProgress(rawExp: unknown, levelRaw: unknown): number {
  const levelNum = Math.max(1, Math.min(MAX_LEVEL, Number(levelRaw) || 1));
  const need = Math.max(0, Number(getExpToNext(levelNum)) || 0);
  let exp = Math.max(0, Number(rawExp) || 0);

  if (need <= 0 || levelNum >= MAX_LEVEL) return 0;
  return Math.max(0, Math.min(exp, Math.max(0, need - 1)));
}

/** Чи предмет стакається (заряди, банки, ресурси) — зброя/броня завжди окремо. */
function isStackableItem(it: any): boolean {
  const typeId = String(it?.id ?? it?.itemId ?? "");
  const def = itemsDB[it?.id ?? it?.itemId] || itemsDBWithStarter[it?.id ?? it?.itemId];
  const slot = def?.slot ?? it?.slot ?? "";
  const stackableSlots = ["consumable", "resource", "quest"];
  return stackableSlots.includes(slot) || typeId.includes("shot") || typeId.includes("potion") ||
    it?.type === "consumable" || it?.type === "resource" || it?.type === "quest";
}

/** Об'єднує інвентарі local + server — ніколи не губити предмети. Зброя/броня — кожен окремо (count:1). */
function mergeInventoriesUnion(localInv: any[], serverInv: any[]): any[] {
  const itemKey = (i: any) => `${i?.id ?? i?.itemId ?? ""}_${i?.enchantLevel ?? 0}`;
  const countByKey = (arr: any[]) => {
    const m = new Map<string, number>();
    (arr || []).forEach((it: any) => {
      if (!it || (!it.id && !it.itemId)) return;
      const key = itemKey(it);
      const cnt = Math.max(1, Number(it.count) ?? 1);
      m.set(key, (m.get(key) ?? 0) + cnt);
    });
    return m;
  };
  const getBestItem = (arr: any[], key: string) =>
    (arr || []).find((it: any) => it && itemKey(it) === key);
  const localCounts = countByKey(localInv);
  const serverCounts = countByKey(serverInv);
  const allKeys = new Set([...localCounts.keys(), ...serverCounts.keys()]);
  const result: any[] = [];
  allKeys.forEach((key) => {
    const total = Math.max(localCounts.get(key) ?? 0, serverCounts.get(key) ?? 0);
    const bestItem = getBestItem(localInv, key) ?? getBestItem(serverInv, key);
    if (!bestItem || total <= 0) return;
    const normalized = { ...bestItem, id: bestItem.id ?? bestItem.itemId };
    if (isStackableItem(bestItem)) {
      result.push({ ...normalized, count: total });
    } else {
      // Зброя/броня — кожен екземпляр окремо, точка відображається всюди
      for (let i = 0; i < total; i++) {
        result.push({ ...normalized, count: 1, enchantLevel: normalized.enchantLevel ?? 0 });
      }
    }
  });
  return result;
}

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
      const serverExp = normalizeExpToLevelProgress(
        character.exp ?? heroData?.exp ?? 0,
        character.level ?? heroData?.level ?? 1
      );
      const localExp = normalizeExpToLevelProgress(
        hydratedLocalHero.exp ?? (hydratedLocalHero as any).heroJson?.exp ?? 0,
        hydratedLocalHero.level ?? (hydratedLocalHero as any).heroJson?.level ?? 1
      );
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
        const localHp = hydratedLocalHero.hp ?? buffedMax.maxHp;
        const localMaxHpSafeguard = hydratedLocalHero.maxHp ?? buffedMax.maxHp;
        const localHpPercent = localMaxHpSafeguard > 0 ? Math.max(0, Math.min(1, localHp / localMaxHpSafeguard)) : 1;
        const finalHp = Math.round(localHpPercent * buffedMax.maxHp);

        const localMp = hydratedLocalHero.mp ?? buffedMax.maxMp;
        const localMaxMp = hydratedLocalHero.maxMp ?? buffedMax.maxMp;
        const localMpPercent = localMaxMp > 0 ? Math.max(0, Math.min(1, localMp / localMaxMp)) : 1;
        const finalMp = Math.round(localMpPercent * buffedMax.maxMp);

        const localCp = hydratedLocalHero.cp ?? buffedMax.maxCp;
        const localMaxCp = hydratedLocalHero.maxCp ?? buffedMax.maxCp;
        const localCpPercent = localMaxCp > 0 ? Math.max(0, Math.min(1, localCp / localMaxCp)) : 1;
        const finalCp = Math.round(localCpPercent * buffedMax.maxCp);
        
        // Для локально пріоритетного героя відновлюємо HP/MP/CP з урахуванням відсотка від старого макс.,
        // щоб при зміні maxHp (напр. зникли бафи або змінився екіп) відсоток здоров'я зберігався.
        // 🔥 Консолідуємо інвентар (заряди, банки, ресурси стакаються) — mergeInventoriesUnion(inv, []) = consolidate
        const localInv = hydratedLocalHero?.inventory ?? [];
        const consolidatedInv = mergeInventoriesUnion(localInv, []);
        const mergedHero: Hero = {
          ...hydratedLocalHero,
          inventory: consolidatedInv,
          name: character.name,
          maxHp: buffedMax.maxHp,
          maxMp: buffedMax.maxMp,
          maxCp: buffedMax.maxCp,
          hp: Math.min(finalHp, buffedMax.maxHp),
          mp: Math.min(finalMp, buffedMax.maxMp),
          cp: Math.min(finalCp, buffedMax.maxCp),
        };
        (mergedHero as any).username = character.name;
        (mergedHero as any).baseMaxHp = recalculated.resources.maxHp;
        (mergedHero as any).baseMaxMp = recalculated.resources.maxMp;
        (mergedHero as any).baseMaxCp = recalculated.resources.maxCp;
        import('./heroPersistence').then(({ saveHeroToLocalStorage }) => {
          saveHeroToLocalStorage(mergedHero).catch((err: any) => {
            console.warn('[loadHeroFromAPI] Background push of local hero failed:', err?.message || err);
          });
        });
        if (import.meta.env.DEV) {
          const hj = (mergedHero as any)?.heroJson || {};
          console.log("[LOAD SNAPSHOT]", {
            hp: mergedHero.hp,
            mp: mergedHero.mp,
            cp: mergedHero.cp,
            maxHp: mergedHero.maxHp,
            isDead: hj.isDead,
            deadAt: hj.deadAt,
            buffs: Array.isArray(hj.heroBuffs) ? hj.heroBuffs.length : 0,
            hpPercent: hj.hpPercent,
            mpPercent: hj.mpPercent,
            cpPercent: hj.cpPercent,
          });
        }
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
      const heroJsonExp = normalizeExpToLevelProgress((heroData as any).exp, finalLevel);
      const characterExp = normalizeExpToLevelProgress(character.exp, finalLevel);
      const finalExp = Math.max(heroJsonExp, characterExp);
      
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
    // 🔥 Union-merge: ніколи не губити предмети (напр. 2 удочки +1000), якщо вони є в local або server
    const mergedInventory = mergeInventoriesUnion(localInv, serverInv);

    const localDyes = hydratedLocalHero?.activeDyes ?? [];
    const serverDyes = fixedHero.activeDyes ?? [];
    const mergedActiveDyes = (localDyes.length >= serverDyes.length ? localDyes : serverDyes) as any;

    const serverActiveQuests = Array.isArray((heroData as any)?.activeQuests) ? (heroData as any).activeQuests : [];
    const localActiveQuests = Array.isArray(hydratedLocalHero?.activeQuests) ? hydratedLocalHero.activeQuests : [];
    const mergedActiveQuests = serverActiveQuests.length > 0 ? serverActiveQuests : localActiveQuests;

    const serverOverflow = Array.isArray((fixedHero as any).overflowChest) ? (fixedHero as any).overflowChest : [];
    const localOverflow = Array.isArray(hydratedLocalHero?.overflowChest) ? hydratedLocalHero.overflowChest : [];
    const serverOverflowTotal = serverOverflow.reduce((s: number, i: any) => s + (i.count ?? 1), 0);
    const localOverflowTotal = localOverflow.reduce((s: number, i: any) => s + (i.count ?? 1), 0);
    const mergedOverflow = localOverflowTotal >= serverOverflowTotal ? localOverflow : serverOverflow;

    const heroForRecalc: Hero = {
      ...fixedHero,
      skills: finalSkillsForRecalc,
      equipment: mergedEquipment,
      inventory: mergedInventory,
      overflowChest: mergedOverflow,
      activeDyes: mergedActiveDyes,
      activeQuests: mergedActiveQuests,
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
    // Якщо сервер мертвий, а локально hp > 0 — вважаємо живим (пріоритет живому стану після resurrect)
    const preferLocalAlive = serverIsDead && localHp > 0;
    const isDead = preferLocalAlive ? false : serverIsDead;
    const finalBuffs = isDead ? [] : savedBuffs;
    const buffedMax = computeBuffedMaxResources(baseMax, finalBuffs);
    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;

    const oldMaxHp = fixedHero.maxHp ?? 0;
    const oldMaxMp = fixedHero.maxMp ?? 0;
    const oldMaxCp = fixedHero.maxCp ?? 0;
    const newMaxIncreasedHp = recalculated.resources.maxHp > oldMaxHp * 1.05;
    const newMaxIncreasedMp = recalculated.resources.maxMp > oldMaxMp * 1.05;
    const newMaxIncreasedCp = recalculated.resources.maxCp > oldMaxCp * 1.05;
    const fillHp = newMaxIncreasedHp || oldMaxHp <= 0;
    const fillMp = newMaxIncreasedMp || oldMaxMp <= 0;
    const fillCp = newMaxIncreasedCp || oldMaxCp <= 0;

    const RESURRECT_ON_LOAD_RATIO = 0.7;
    let finalHp: number;
    let finalMp: number;
    let finalCp: number;
    let isAliveAfterLoad = isDead;
    if (preferLocalAlive) {
      finalHp = Math.min(finalMaxHp, Math.max(1, localHp));
      finalMp = Math.min(finalMaxMp, Math.max(0, Number(hydratedLocalHero?.mp ?? 0)));
      finalCp = Math.min(finalMaxCp, Math.max(0, Number(hydratedLocalHero?.cp ?? 0)));
    } else if (isDead) {
      // Після оновлення сторінки після смерті: відновлюємо до 70% max — герой не лишається мертвим
      finalHp = Math.max(1, Math.round(finalMaxHp * RESURRECT_ON_LOAD_RATIO));
      finalMp = Math.max(0, Math.round(finalMaxMp * RESURRECT_ON_LOAD_RATIO));
      finalCp = Math.max(0, Math.round(finalMaxCp * RESURRECT_ON_LOAD_RATIO));
      isAliveAfterLoad = true;
    } else {
      finalHp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.hpPercent,
        fullFlag: Boolean(heroData?.hpFull) || fillHp,
        savedValueRaw: fixedHero.hp,
        savedMaxRaw: heroDataAny?.maxHp,
        finalMax: finalMaxHp,
        isDead: false,
      });
      finalMp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.mpPercent,
        fullFlag: Boolean(heroData?.mpFull) || fillMp,
        savedValueRaw: fixedHero.mp,
        savedMaxRaw: heroDataAny?.maxMp,
        finalMax: finalMaxMp,
        isDead: false,
      });
      finalCp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.cpPercent,
        fullFlag: Boolean(heroData?.cpFull) || fillCp,
        savedValueRaw: fixedHero.cp,
        savedMaxRaw: heroDataAny?.maxCp,
        finalMax: finalMaxCp,
        isDead: false,
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
    
    // Щоденні завдання: завжди беремо максимум з локального та серверного прогресу, щоб прогрес оновлювався миттєво і не перезаписувався старим API
    const serverProgress = (fixedHero as any).dailyQuestsProgress ?? (heroData as any)?.dailyQuestsProgress ?? {};
    const localProgress = (hydratedLocalHero as any)?.dailyQuestsProgress ?? {};
    const mergedProgress: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(serverProgress || {}), ...Object.keys(localProgress || {})]);
    allKeys.forEach((id) => {
      mergedProgress[id] = Math.max(
        Number((serverProgress as any)?.[id]) || 0,
        Number((localProgress as any)?.[id]) || 0
      );
    });
    // Завжди задаємо dailyQuestsProgress (об'єкт), щоб UI та victory-блок не отримували undefined
    const dailyQuestsProgress: Record<string, number> = Object.keys(mergedProgress).length > 0 ? mergedProgress : {};
    const serverCompleted = (fixedHero as any).dailyQuestsCompleted ?? (heroData as any)?.dailyQuestsCompleted ?? [];
    const localCompleted = (hydratedLocalHero as any)?.dailyQuestsCompleted ?? [];
    const dailyQuestsCompleted = Array.from(new Set([
      ...(Array.isArray(serverCompleted) ? serverCompleted : []),
      ...(Array.isArray(localCompleted) ? localCompleted : []),
    ]));
    const dailyQuestsResetDate = (fixedHero as any).dailyQuestsResetDate ?? (heroData as any)?.dailyQuestsResetDate ?? hydratedLocalHero?.dailyQuestsResetDate;

    // 🔥 КРИТИЧНО: adena — max(локаль, сервер), щоб після продажу GET не перезаписував нову адена старим значенням з API
    const serverAdenaVal = Number(fixedHero.adena ?? (heroData as any)?.adena ?? 0);
    const localAdenaVal = Number(hydratedLocalHero?.adena ?? (hydratedLocalHero as any)?.heroJson?.adena ?? 0);
    const finalAdena = Math.max(serverAdenaVal, localAdenaVal);

    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      adena: finalAdena,
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
      // Щоденні завдання та активні квести — завжди встановлюємо, щоб не губити після F5
      dailyQuestsProgress,
      dailyQuestsCompleted,
      ...(dailyQuestsResetDate !== undefined ? { dailyQuestsResetDate } : {}),
      activeQuests: mergedActiveQuests,
    };
    (heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
    (heroWithRecalculatedStats as any).baseMaxMp = recalculated.resources.maxMp;
    (heroWithRecalculatedStats as any).baseMaxCp = recalculated.resources.maxCp;
    // 🔥 Якщо живий або відновлено 70% після смерті при reload — heroJson isDead: false
    const loadedHeroJson = heroData || (fixedHero as any).heroJson || {};
    (heroWithRecalculatedStats as any).heroJson = {
      ...loadedHeroJson,
      ...(preferLocalAlive || finalHp > 0 || isAliveAfterLoad ? { isDead: false, deadAt: 0 } : {}),
      heroBuffs: isDead && !isAliveAfterLoad ? [] : (loadedHeroJson.heroBuffs ?? finalBuffs),
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
      // 🔥 КРИТИЧНО: Union-merge інвентаря — ніколи не губити предмети (удочки +1000 тощо)
      if (hydratedLocalHero) {
        const localInv = hydratedLocalHero.inventory ?? [];
        const serverInv = hydratedHero.inventory ?? [];
        const localEquip = hydratedLocalHero.equipment ?? {};
        const serverEquip = hydratedHero.equipment ?? {};
        const mergedInv = mergeInventoriesUnion(localInv, serverInv);
        (hydratedHero as any).inventory = mergedInv;
        (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, inventory: mergedInv };
        if (hydratedLocalHero.adena !== undefined && hydratedLocalHero.adena !== null) {
          (hydratedHero as any).adena = hydratedLocalHero.adena;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, adena: hydratedLocalHero.adena };
        }
        console.log('[loadHeroFromAPI] Applied inventory union merge:', mergedInv.length, 'items');
        const localEquipCount = Object.keys(localEquip).filter((k) => localEquip[k] != null).length;
        const serverEquipCount = Object.keys(serverEquip).filter((k) => serverEquip[k] != null).length;
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

    const finalHero = hydratedHero || heroWithRecalculatedStats;
    if (import.meta.env.DEV && finalHero) {
      const hj = (finalHero as any)?.heroJson || {};
      console.log("[LOAD SNAPSHOT]", {
        hp: finalHero.hp,
        mp: finalHero.mp,
        cp: finalHero.cp,
        maxHp: finalHero.maxHp,
        isDead: hj.isDead,
        deadAt: hj.deadAt,
        buffs: Array.isArray(hj.heroBuffs) ? hj.heroBuffs.length : 0,
        hpPercent: hj.hpPercent,
        mpPercent: hj.mpPercent,
        cpPercent: hj.cpPercent,
      });
    }
    return finalHero;
  } catch (error) {
    console.error('[loadHeroFromAPI] Failed to load hero from API:', error);
    console.warn('[loadHeroFromAPI] Returning null - will fallback to localStorage');
    // Повертаємо null, щоб App.tsx міг використати fallback на localStorage
    return null;
  }
}
