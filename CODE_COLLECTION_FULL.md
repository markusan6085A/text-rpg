# Повний збір коду: Hero Load/Update, Resources, HP/MP, Buffs, Backend

---

## Frontend

---

### 1. src/state/heroStore/heroLoad.ts

```typescript
/**
 * heroLoad — ЄДИНЕ МІСЦЕ ЧИТАННЯ героя з localStorage (l2_accounts_v2).
 *
 * ЄДИНЕ ДЖЕРЕЛО ПРАВДИ:
 * - Запис hero в localStorage робить ТІЛЬКИ heroPersistence (при збереженні прогресу).
 * - heroLoad лише ЧИТАЄ і нормалізує в пам'яті. В кінці loadHero() НЕ пишемо hero назад
 *   (щоб не перезаписати новіший стан від heroPersistence).
 * - Запис у heroLoad тільки при міграціях: fixProfession, fix inventory (Angel Slayer).
 */
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { fixHeroProfession } from "../../utils/fixProfession";
import { loadBattle } from "../battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import { getJSON, getString, removeItem, setJSON } from "../persistence";
import type { Hero } from "../../types/Hero";
import { calcBaseStats } from "../../utils/stats/calcBaseStats";
import { hydrateHero } from "./heroHydration";

export function loadHero(): Hero | null {
  // Міграція: видаляємо старий ключ l2_progress (більше не використовується)
  // Дані тепер зберігаються в l2_accounts_v2
  if (getString("l2_progress")) {
    removeItem("l2_progress");
  }

  const username = getJSON<string | null>("l2_current_user", null);
  if (!username) {
    return null;
  }

  const accounts = getJSON<any[]>("l2_accounts_v2", []);
  if (!Array.isArray(accounts)) {
    return null;
  }

  // Виправляємо всіх героїв при завантаженні
  let updated = false;
  accounts.forEach((acc: any) => {
    if (!acc.hero) return;
    const fixedHero = fixHeroProfession(acc.hero);
    if (fixedHero !== acc.hero) {
      acc.hero = fixedHero;
      updated = true;
    }
    
    // Міграція: виправляємо предмети "Angel Slayer", які були куплені як лук (itemId: 7575)
    if (fixedHero.inventory && Array.isArray(fixedHero.inventory)) {
      let inventoryUpdated = false;
      fixedHero.inventory.forEach((item: any) => {
        if (item.id === "s_angel_slayer" && item.stats) {
          if (item.stats.pAtk === 581 && item.stats.pAtkSpd === 293) {
            item.id = "s_draconic_bow";
            item.name = "Draconic Bow";
            item.icon = "/items/drops/weapon_s/weapon_draconic_bow_i00.png";
            item.description = "Драконовий Лук S-grade.";
            inventoryUpdated = true;
          }
        }
      });
      if (inventoryUpdated) {
        acc.hero = fixedHero;
        updated = true;
      }
    }
  });
  if (updated) {
    setJSON("l2_accounts_v2", accounts);
  }

    const acc = accounts.find((a: any) => a.username === username);
    if (acc && acc.hero) {
      const fixedHero = fixHeroProfession(acc.hero);
      if (fixedHero !== acc.hero) {
        acc.hero = fixedHero;
        const accIndex = accounts.findIndex((a: any) => a.username === username);
        if (accIndex !== -1) {
          accounts[accIndex].hero = fixedHero;
          setJSON("l2_accounts_v2", accounts);
        }
      }
      
      const heroJson = (fixedHero as any).heroJson || {};
      if (fixedHero.exp === undefined || fixedHero.exp === null) fixedHero.exp = Number(heroJson.exp ?? 0);
      if (fixedHero.level === undefined || fixedHero.level === null) fixedHero.level = Number(heroJson.level ?? 1);
      if (fixedHero.sp === undefined || fixedHero.sp === null) fixedHero.sp = Number(heroJson.sp ?? 0);
      if (fixedHero.adena === undefined || fixedHero.adena === null) fixedHero.adena = Number(heroJson.adena ?? 0);
      if ((fixedHero as any).coinOfLuck === undefined || (fixedHero as any).coinOfLuck === null) (fixedHero as any).coinOfLuck = Number((heroJson as any).coinOfLuck ?? 0);
      if (fixedHero.premiumUntil === undefined || fixedHero.premiumUntil === null) (fixedHero as any).premiumUntil = Number((heroJson as any).premiumUntil ?? 0) || undefined;
      if (fixedHero.hp === undefined || fixedHero.hp === null) fixedHero.hp = Number(heroJson.hp ?? 0);
      if (fixedHero.mp === undefined || fixedHero.mp === null) fixedHero.mp = Number(heroJson.mp ?? 0);
      if (fixedHero.cp === undefined || fixedHero.cp === null) fixedHero.cp = Number(heroJson.cp ?? 0);
      const mobsKilled = (fixedHero as any).mobsKilled ?? heroJson.mobsKilled ?? heroJson.mobs_killed ?? heroJson.killedMobs ?? heroJson.totalKills ?? 0;
      (fixedHero as any).mobsKilled = mobsKilled;
      const heroEquip = fixedHero.equipment ?? {};
      const jsonEquip = (heroJson as any).equipment ?? {};
      fixedHero.equipment = { ...jsonEquip, ...heroEquip };
      const heroEnch = fixedHero.equipmentEnchantLevels ?? {};
      const jsonEnch = (heroJson as any).equipmentEnchantLevels ?? {};
      fixedHero.equipmentEnchantLevels = { ...jsonEnch, ...heroEnch };
      const heroSkills = Array.isArray(fixedHero.skills) ? fixedHero.skills : [];
      const jsonSkills = Array.isArray((heroJson as any).skills) ? (heroJson as any).skills : [];
      const skillById = new Map<number, { id: number; level: number }>();
      for (const s of jsonSkills) {
        const id = Number((s as any).id);
        const lvl = Number((s as any).level) || 1;
        if (id) skillById.set(id, { id, level: lvl });
      }
      for (const s of heroSkills) {
        const id = Number((s as any).id);
        const lvl = Number((s as any).level) || 1;
        if (!id) continue;
        const cur = skillById.get(id);
        if (!cur || cur.level < lvl) skillById.set(id, { id, level: lvl });
      }
      fixedHero.skills = skillById.size > 0 ? Array.from(skillById.values()).map(({ id, level }) => ({ id, level })) : (heroSkills.length > 0 ? heroSkills : jsonSkills);
      const heroDyes = Array.isArray(fixedHero.activeDyes) ? fixedHero.activeDyes : [];
      const jsonDyes = Array.isArray((heroJson as any).activeDyes) ? (heroJson as any).activeDyes : [];
      fixedHero.activeDyes = heroDyes.length >= jsonDyes.length ? heroDyes : jsonDyes;
      if ((fixedHero as any).dailyQuestsProgress === undefined && (heroJson as any).dailyQuestsProgress) (fixedHero as any).dailyQuestsProgress = (heroJson as any).dailyQuestsProgress;
      if ((fixedHero as any).dailyQuestsCompleted === undefined && Array.isArray((heroJson as any).dailyQuestsCompleted)) (fixedHero as any).dailyQuestsCompleted = (heroJson as any).dailyQuestsCompleted;
      if ((fixedHero as any).dailyQuestsResetDate === undefined && (heroJson as any).dailyQuestsResetDate) (fixedHero as any).dailyQuestsResetDate = (heroJson as any).dailyQuestsResetDate;
      const heroInv = fixedHero.inventory ?? [];
      const jsonInv = (heroJson as any).inventory ?? [];
      if (Array.isArray(heroInv) && Array.isArray(jsonInv)) {
        fixedHero.inventory = heroInv.length >= jsonInv.length ? heroInv : jsonInv;
      } else if (Array.isArray(jsonInv) && jsonInv.length > 0 && (!heroInv || heroInv.length === 0)) {
        fixedHero.inventory = jsonInv;
      }

      if (fixedHero.inventory && Array.isArray(fixedHero.inventory)) {
        let inventoryUpdated = false;
        fixedHero.inventory.forEach((item: any) => {
          if (item.id === "s_angel_slayer" && item.stats) {
            if (item.stats.pAtk === 581 && item.stats.pAtkSpd === 293) {
              item.id = "s_draconic_bow";
              item.name = "Draconic Bow";
              item.icon = "/items/drops/weapon_s/weapon_draconic_bow_i00.png";
              item.description = "Драконовий Лук S-grade.";
              inventoryUpdated = true;
            }
          }
        });
        if (inventoryUpdated) {
          const accIndex = accounts.findIndex((a: any) => a.username === username);
          if (accIndex !== -1) {
            accounts[accIndex].hero = fixedHero;
            setJSON("l2_accounts_v2", accounts);
          }
        }
      }

    const currentBaseStats = fixedHero.baseStats;
    const hasCorruptedStats = currentBaseStats && (
      (currentBaseStats.STR > 100) || 
      (currentBaseStats.DEX > 100) || 
      (currentBaseStats.INT > 100) ||
      (currentBaseStats.WIT > 100) ||
      (currentBaseStats.CON > 100) ||
      (currentBaseStats.MEN > 100)
    );
    
    if (hasCorruptedStats) {
      const restoredBaseStats = calcBaseStats(
        fixedHero.race || "Human",
        fixedHero.klass || fixedHero.profession || "Fighter"
      );
      fixedHero.baseStats = restoredBaseStats;
      fixedHero.baseStatsInitial = { ...restoredBaseStats };
    }
    
    if (!fixedHero.baseStatsInitial) {
      fixedHero.baseStatsInitial = { ...fixedHero.baseStats };
    }
    
    if (fixedHero.warehouseCapacity === undefined) {
      fixedHero.warehouseCapacity = 100;
    }
    
    const now = Date.now();
    const savedBattle = loadBattle(fixedHero.name);
    const heroJsonBuffs = Array.isArray((fixedHero as any).heroBuffs) ? (fixedHero as any).heroBuffs : Array.isArray((fixedHero as any).heroJson?.heroBuffs) ? (fixedHero as any).heroJson.heroBuffs : [];
    const savedBattleBuffs = savedBattle?.heroBuffs || [];
    const allBuffsRaw = [...heroJsonBuffs, ...savedBattleBuffs];
    const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
    const bestByKey = new Map<string, any>();
    for (const b of allBuffsRaw) {
      const key = byKey(b);
      const cur = bestByKey.get(key);
      const exp = b.expiresAt ?? 0;
      if (!cur || (cur.expiresAt ?? 0) < exp) bestByKey.set(key, b);
    }
    const savedBuffs = cleanupBuffs(Array.from(bestByKey.values()), now);
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
    };
    (heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
    (heroWithRecalculatedStats as any).baseMaxMp = recalculated.resources.maxMp;
    (heroWithRecalculatedStats as any).baseMaxCp = recalculated.resources.maxCp;
    
    const hydratedHero = hydrateHero(heroWithRecalculatedStats);
    
    return hydratedHero || heroWithRecalculatedStats;
  }
  
  return null;
}
```

---

### 2. src/state/heroStore/heroLoadAPI.ts

```typescript
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
import { getRateLimitRemainingMs } from "../heroStore";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

export async function loadHeroFromAPI(): Promise<Hero | null> {
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

  if (!authStore.isAuthenticated || !characterStore.characterId) {
    return null;
  }

  if (getRateLimitRemainingMs() > 0) {
    const localHero = loadHero();
    const hydrated = hydrateHero(localHero);
    if (hydrated) return hydrated;
    return localHero ? hydrateHero(localHero) : null;
  }

  try {
    const localHero = loadHero();
    const hydratedLocalHero = hydrateHero(localHero);
    
    let character;
    try {
      character = await getCharacter(characterStore.characterId);
    } catch (apiErr: any) {
      if (apiErr?.status === 429 || apiErr?.message?.includes?.('rate_limit')) {
        if (hydratedLocalHero) return hydratedLocalHero;
        return localHero ? hydrateHero(localHero) : null;
      }
      throw apiErr;
    }
    
    if (character && hydratedLocalHero) {
      const heroData = character.heroJson as any;
      const serverSkillsArr = Array.isArray(heroData?.skills) ? heroData.skills : [];
      const localSkillsArr = Array.isArray(hydratedLocalHero.skills) ? hydratedLocalHero.skills : [];
      const skillLevelSum = (arr: any[]) => arr.reduce((s, sk) => s + (Number((sk as any).level) || 1), 0);
      const serverSkillLevelsSum = skillLevelSum(serverSkillsArr);
      const localSkillLevelsSum = skillLevelSum(localSkillsArr);
      const serverMobsKilled = Number(heroData?.mobsKilled ?? 0);
      const localMobsKilled = Number((hydratedLocalHero as any).mobsKilled ?? (hydratedLocalHero as any).heroJson?.mobsKilled ?? 0);
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
        const heroData2 = character.heroJson as any;
        const serverMaxHp = heroData2?.maxHp != null ? Number(heroData2.maxHp) : 0;
        const serverMaxMp = heroData2?.maxMp != null ? Number(heroData2.maxMp) : 0;
        const serverMaxCp = heroData2?.maxCp != null ? Number(heroData2.maxCp) : 0;
        const localMaxHp = hydratedLocalHero.maxHp ?? 0;
        const serverMaxNotStale = serverMaxHp >= localMaxHp * 0.9 && serverMaxMp >= (hydratedLocalHero.maxMp ?? 0) * 0.9 && serverMaxCp >= (hydratedLocalHero.maxCp ?? 0) * 0.9;
        const serverHp = serverMaxNotStale && heroData2?.hp != null ? Number(heroData2.hp) : undefined;
        const serverMp = serverMaxNotStale && heroData2?.mp != null ? Number(heroData2.mp) : undefined;
        const serverCp = serverMaxNotStale && heroData2?.cp != null ? Number(heroData2.cp) : undefined;
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
      
      const conflict = checkSyncConflict(character, hydratedLocalHero);
      if (conflict.hasConflict) {
        const resolution = resolveSyncConflict(conflict);
        const message = getConflictMessage(conflict);
        if (conflict.localNewer) {
          saveLocalBackup(hydratedLocalHero, conflict);
        }
      }
    }
    
    if (!character) {
      return null;
    }
    
    const heroData = character.heroJson as any;
    const mobsKilledFromData = heroData?.mobsKilled ?? heroData?.mobs_killed ?? heroData?.killedMobs ?? heroData?.totalKills ?? undefined;
    
    if (heroData?.inventory && Array.isArray(heroData.inventory)) {
      heroData.inventory = heroData.inventory.map((it: any) => {
        if (it.slot === "inventory" || !it.slot) {
          const def = itemsDB[it.id || it.itemId] || itemsDBWithStarter[it.id || it.itemId];
          if (def) return { ...it, slot: def.slot || "other", name: it.name || def.name };
        }
        return it;
      });
    }
    
    let fixedHero: Hero;
    if (!heroData || typeof heroData !== 'object' || Object.keys(heroData).length === 0) {
      const newHero = createNewHero({
        id: `hero_${Date.now()}`,
        name: character.name,
        username: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
      });
      fixedHero = fixHeroProfession(newHero);
      fixedHero.level = character.level;
      fixedHero.exp = Number(character.exp);
      fixedHero.sp = character.sp;
      fixedHero.adena = character.adena;
      fixedHero.coinOfLuck = character.coinLuck;
      fixedHero.aa = character.aa || 0;
      const finalMobsKilled = mobsKilledFromData !== undefined ? mobsKilledFromData : 0;
      (fixedHero as any).mobsKilled = finalMobsKilled;
      fixedHero.skills = fixedHero.skills || [];
    } else {
      const finalMobsKilled = mobsKilledFromData !== undefined ? mobsKilledFromData : 0;
      const heroJsonLevel = (heroData as any).level;
      const finalLevel = heroJsonLevel !== undefined && heroJsonLevel > character.level ? heroJsonLevel : character.level;
      const heroJsonExp = (heroData as any).exp;
      const finalExp = heroJsonExp !== undefined && heroJsonExp > Number(character.exp) ? heroJsonExp : Number(character.exp);
      const serverSkillsArr = Array.isArray((heroData as any).skills) ? (heroData as any).skills : [];
      
      fixedHero = fixHeroProfession({
        ...heroData,
        level: finalLevel,
        exp: finalExp,
        sp: character.sp,
        adena: character.adena,
        coinOfLuck: character.coinLuck,
        aa: character.aa || 0,
        name: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
        skills: serverSkillsArr,
        mobsKilled: finalMobsKilled as any,
      } as Hero);
    }

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
    const finalSkillsForRecalc = skillById.size > 0 ? Array.from(skillById.values()).map(({ id, level }) => ({ id, level })) : (fixedHero.skills || []);

    const localEquip = hydratedLocalHero?.equipment ?? {};
    const mergedEquipment = { ...(fixedHero.equipment ?? {}), ...localEquip };

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

    const now = Date.now();
    const savedBattle = loadBattle(fixedHero.name);
    const heroJsonBuffs = Array.isArray((fixedHero as any).heroBuffs) ? (fixedHero as any).heroBuffs : Array.isArray((fixedHero as any).heroJson?.heroBuffs) ? (fixedHero as any).heroJson.heroBuffs : [];
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
    const uniqueBuffs = Array.from(bestByKey.values());
    const savedBuffs = cleanupBuffs(uniqueBuffs, now);
    const recalculated = recalculateAllStats(heroForRecalc, []);

    const baseMax = { maxHp: recalculated.resources.maxHp, maxMp: recalculated.resources.maxMp, maxCp: recalculated.resources.maxCp };
    const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);

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

    const finalHp = fillHp || fixedHero.hp === undefined || fixedHero.hp <= 0 || fixedHero.hp >= finalMaxHp
      ? finalMaxHp : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));

    const finalMp = fillMp || fixedHero.mp === undefined || fixedHero.mp <= 0 || fixedHero.mp >= finalMaxMp
      ? finalMaxMp : Math.min(finalMaxMp, Math.max(fixedHero.mp, 0));

    const finalCp = fillCp || fixedHero.cp === undefined || fixedHero.cp <= 0 || fixedHero.cp >= finalMaxCp
      ? finalMaxCp : Math.min(finalMaxCp, Math.max(fixedHero.cp, 0));

    const currentMobsKilled = (fixedHero as any).mobsKilled ?? (fixedHero as any).mobs_killed ?? (fixedHero as any).killedMobs ?? (fixedHero as any).totalKills ?? ((fixedHero as any).heroJson?.mobsKilled) ?? ((fixedHero as any).heroJson?.mobs_killed) ?? ((fixedHero as any).heroJson?.killedMobs) ?? ((fixedHero as any).heroJson?.totalKills) ?? 0;
    const localMobsKilled = (hydratedLocalHero as any)?.mobsKilled ?? 0;
    const serverMobsKilled = mobsKilledFromData ?? 0;
    const finalSkills = finalSkillsForRecalc;
    const finalMobsKilled = localMobsKilled > serverMobsKilled ? localMobsKilled : (serverMobsKilled > 0 ? serverMobsKilled : currentMobsKilled);
    
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
      ...((character as any).blockedUntil ? { blockedUntil: (character as any).blockedUntil } : {}),
      ...((character as any).bannedUntil ? { bannedUntil: (character as any).bannedUntil } : {}),
      ...(dailyQuestsProgress !== undefined ? { dailyQuestsProgress } : {}),
      ...(dailyQuestsCompleted !== undefined ? { dailyQuestsCompleted } : {}),
      ...(dailyQuestsResetDate !== undefined ? { dailyQuestsResetDate } : {}),
    };
    (heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
    (heroWithRecalculatedStats as any).baseMaxMp = recalculated.resources.maxMp;
    (heroWithRecalculatedStats as any).baseMaxCp = recalculated.resources.maxCp;
    (heroWithRecalculatedStats as any).heroJson = heroData || (fixedHero as any).heroJson || {};
    
    const hydratedHero = hydrateHero(heroWithRecalculatedStats);
    
    if (hydratedHero) {
      (hydratedHero as any).id = character.id;
      (hydratedHero as any).heroRevision = (heroData as any)?.heroRevision || (character as any)?.heroRevision || undefined;
      (hydratedHero as any).heroJson = {
        ...(hydratedHero as any).heroJson,
        heroBuffs: savedBuffs,
      };

      if (hydratedLocalHero) {
        const localPremiumUntil = (hydratedLocalHero as any).premiumUntil ?? (hydratedLocalHero as any).heroJson?.premiumUntil;
        const serverPremiumUntil = (hydratedHero as any).premiumUntil ?? (hydratedHero as any).heroJson?.premiumUntil;
        if (localPremiumUntil != null && Number(localPremiumUntil) > Number(serverPremiumUntil || 0)) {
          (hydratedHero as any).premiumUntil = localPremiumUntil;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, premiumUntil: localPremiumUntil };
          const localCoinOfLuck = (hydratedLocalHero as any).coinOfLuck ?? (hydratedLocalHero as any).heroJson?.coinOfLuck;
          if (localCoinOfLuck !== undefined && localCoinOfLuck !== null) {
            (hydratedHero as any).coinOfLuck = localCoinOfLuck;
            (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, coinOfLuck: localCoinOfLuck };
          }
        }
      }
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
        }
        if (localEquipCount > serverEquipCount) {
          (hydratedHero as any).equipment = localEquip;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, equipment: localEquip };
        }
      }
    }
    
    if (hydratedHero) {
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
    }

    const wasEmpty = !heroData || typeof heroData !== 'object' || Object.keys(heroData).length === 0;
    if (wasEmpty && hydratedHero) {
      updateCharacter(character.id, { heroJson: (hydratedHero as any).heroJson }).then(() => {}).catch((error) => {
        console.error('[loadHeroFromAPI] Failed to save created hero to database:', error);
      });
    }

    return hydratedHero || heroWithRecalculatedStats;
  } catch (error) {
    console.error('[loadHeroFromAPI] Failed to load hero from API:', error);
    return null;
  }
}
```

---

### 3. src/state/heroStore/heroUpdate.ts

```typescript
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { loadBattle } from "../battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import type { Hero } from "../../types/Hero";
import { hydrateHero } from "./heroHydration";

export function updateHeroLogic(
  prev: Hero,
  partial: Partial<Hero>
): Hero {
  const newMobsKilled = (partial as any).mobsKilled !== undefined ? (partial as any).mobsKilled : (prev as any).mobsKilled;
  
  let updated = { 
    ...prev, 
    ...partial,
    profession: partial.profession !== undefined ? partial.profession : prev.profession,
    klass: partial.klass !== undefined ? partial.klass : prev.klass,
    race: partial.race !== undefined ? partial.race : prev.race,
    gender: partial.gender !== undefined ? partial.gender : prev.gender,
    mobsKilled: newMobsKilled,
  };
  
  if (partial.skills !== undefined) {
    updated.skills = partial.skills;
  }
  if ((partial as any).mobsKilled !== undefined) {
    (updated as any).mobsKilled = (partial as any).mobsKilled;
  }

  const needsRecalc =
    partial.level !== undefined ||
    partial.skills !== undefined ||
    partial.equipment !== undefined ||
    partial.baseStats !== undefined ||
    partial.profession !== undefined ||
    partial.klass !== undefined ||
    partial.equipmentEnchantLevels !== undefined ||
    partial.activeDyes !== undefined;

  if (!needsRecalc && (partial.hp !== undefined || partial.mp !== undefined || partial.cp !== undefined)) {
    if (partial.hp !== undefined) updated.hp = Math.max(0, partial.hp);
    if (partial.mp !== undefined) updated.mp = Math.max(0, partial.mp);
    if (partial.cp !== undefined) updated.cp = Math.max(0, partial.cp);
  }

  if (needsRecalc) {
    const now = Date.now();
    const savedBattle = loadBattle(updated.name);
    const inBattle = savedBattle?.status && savedBattle.status !== "idle";
    const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
    const recalculated = recalculateAllStats(updated, savedBuffs);
    
    if (!updated.baseStatsInitial) {
      updated.baseStatsInitial = recalculated.originalBaseStats;
    }
    
    const baseMax = {
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
    };
    const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
    
    const isLevelUp = partial.level !== undefined && partial.level !== prev.level;
    const shouldUpdateResources = !inBattle || isLevelUp;
    
    const hpToUse = partial.hp !== undefined ? partial.hp : prev.hp;
    const safeHp =
      hpToUse === undefined || hpToUse <= 0
        ? buffedMax.maxHp
        : Math.min(buffedMax.maxHp, Math.max(0, hpToUse));
    
    const mpToUse = partial.mp !== undefined ? partial.mp : prev.mp;
    const safeMp =
      mpToUse === undefined || mpToUse <= 0
        ? buffedMax.maxMp
        : Math.min(buffedMax.maxMp, Math.max(0, mpToUse));
    
    const cpToUse = partial.cp !== undefined ? partial.cp : prev.cp;
    const safeCp =
      cpToUse === undefined || cpToUse <= 0
        ? buffedMax.maxCp
        : Math.min(buffedMax.maxCp, Math.max(0, cpToUse));
    
    updated = {
      ...updated,
      baseStats: recalculated.originalBaseStats,
      maxHp: buffedMax.maxHp,
      maxMp: buffedMax.maxMp,
      maxCp: buffedMax.maxCp,
      battleStats: recalculated.baseFinalStats,
      ...(shouldUpdateResources ? {
        hp: isLevelUp ? buffedMax.maxHp : safeHp,
        mp: isLevelUp ? buffedMax.maxMp : safeMp,
        cp: isLevelUp ? buffedMax.maxCp : safeCp,
      } : {}),
    };
    (updated as any).baseMaxHp = recalculated.resources.maxHp;
    (updated as any).baseMaxMp = recalculated.resources.maxMp;
    (updated as any).baseMaxCp = recalculated.resources.maxCp;
  }

  const hydrated = hydrateHero(updated);
  
  if (hydrated) {
    const existingHeroJson = (hydrated as any).heroJson || {};
    const newHeroBuffs = (partial as any).heroJson?.heroBuffs !== undefined 
      ? (partial as any).heroJson.heroBuffs 
      : (existingHeroJson.heroBuffs || (prev as any).heroJson?.heroBuffs || []);
    
    (hydrated as any).heroJson = {
      ...existingHeroJson,
      ...((partial as any).heroJson || {}),
      heroBuffs: newHeroBuffs,
    };
  }

  return hydrated || updated;
}
```

---

### 4. src/state/heroStore/heroPersistence.ts

```typescript
/**
 * heroPersistence — ЄДИНЕ МІСЦЕ ЗАПИСУ героя в localStorage (l2_accounts_v2).
 *
 * ЗАЛІЗОБЕТОН:
 * - localStorage = миттєвий snapshot: saveHeroToLocalStorageOnly() викликається СИНХРОННО з heroStore
 *   при КОЖНІЙ зміні hero (setHero, loadHero, updateHero). Без debounce, без очікування API.
 * - API = "доставимо коли зможемо": saveHeroToLocalStorage() — async, debounce/queue/rate limit.
 *
 * Читання з localStorage — тільки heroLoad (loadHero()). Запис — тільки тут.
 * App/Landing/Register НІКОЛИ не пишуть hero в l2_accounts_v2.
 */
import type { Hero } from "../../types/Hero";
import { updateCharacter, getCharacter } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { getJSON, setJSON } from "../persistence";
import { loadBattle } from "../battle/persist";
import { hydrateHero } from "./heroHydration";

let saving = false;
let queued = false;
let retryCount = 0;
const MAX_RETRIES = 1;

function buildBackupHeroJson(hero: Hero): Record<string, unknown> {
  const mobsKilled = (hero as any).mobsKilled ?? (hero as any).mobs_killed ?? (hero as any).killedMobs ?? (hero as any).totalKills ?? 0;
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
    activeDyes: Array.isArray(hero.activeDyes) ? hero.activeDyes : [],
  };
}

export function saveHeroToLocalStorageOnly(hero: Hero): void {
  if (!hero || !hero.name) return;
  const hydrated = hydrateHero(hero);
  if (!hydrated) return;
  const current = getJSON<string | null>("l2_current_user", null);
  if (!current) return;
  const accounts = getJSON<any[]>("l2_accounts_v2", []);
  const accIndex = accounts.findIndex((a: any) => a.username === current);
  if (accIndex === -1) return;
  const existingJson = (hydrated as any).heroJson || {};
  const battleState = loadBattle(hydrated.name);
  const battleBuffs = Array.isArray(battleState?.heroBuffs) ? battleState.heroBuffs : [];
  const jsonBuffs = Array.isArray(existingJson.heroBuffs) ? existingJson.heroBuffs : [];
  const mergedBuffs = [...jsonBuffs, ...battleBuffs].filter((b: any, i: number, arr: any[]) =>
    arr.findIndex((x: any) => (x.id && b.id && x.id === b.id) || (!x.id && !b.id && x.name === b.name)) === i
  );
  const heroJson = {
    ...existingJson,
    ...buildBackupHeroJson(hydrated),
    heroBuffs: mergedBuffs.length ? mergedBuffs : (existingJson.heroBuffs ?? []),
  };
  accounts[accIndex].hero = { ...hydrated, heroJson };
  setJSON("l2_accounts_v2", accounts);
}

export async function saveHeroToLocalStorage(hero: Hero): Promise<void> {
  if (!hero || !hero.name) return;
  if (saving) {
    queued = true;
    return;
  }
  saving = true;
  retryCount = 0;
  try {
    await saveHeroOnce(hero);
  } finally {
    saving = false;
    if (queued) {
      queued = false;
      setTimeout(async () => {
        try {
          const { useHeroStore } = await import('../heroStore');
          const currentHero = useHeroStore.getState().hero;
          if (currentHero) await saveHeroToLocalStorage(currentHero);
        } catch (err) {
          console.error('[saveHeroToLocalStorage] Failed to save queued hero:', err);
        }
      }, 100);
    }
  }
}

async function saveHeroOnce(hero: Hero): Promise<void> {
  const hydrated = hydrateHero(hero);
  if (!hydrated) return;
  hero = hydrated;
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

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

  try {
    const { getRateLimitRemainingMs } = await import('../heroStore');
    if (getRateLimitRemainingMs() > 0) {
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            _rateLimitSkip: true,
            heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
        }
      }
      return;
    }

    const expectedRevision = (hero as any).heroRevision;
    const currentMobsKilled = (hero as any).mobsKilled ?? (hero as any).mobs_killed ?? (hero as any).killedMobs ?? (hero as any).totalKills ?? ((hero as any).heroJson?.mobsKilled) ?? ((hero as any).heroJson?.mobs_killed) ?? ((hero as any).heroJson?.killedMobs) ?? ((hero as any).heroJson?.totalKills) ?? 0;
    const existingHeroJson = (hero as any).heroJson ?? {};

    const savedBattle = loadBattle(hero.name);
    const battleBuffs = savedBattle?.heroBuffs || [];
    const heroJsonBuffs = Array.isArray(existingHeroJson.heroBuffs) ? existingHeroJson.heroBuffs : [];
    const allBuffs = [...heroJsonBuffs, ...battleBuffs];
    const uniqueBuffs = allBuffs.filter((buff: any, index: number, self: any[]) => 
      index === self.findIndex((b: any) => 
        (b.id && buff.id && b.id === buff.id) || (!b.id && !buff.id && b.name === buff.name)
      )
    );

    const requiredName = String(existingHeroJson.name ?? hero.name ?? "");
    const requiredRace = String(existingHeroJson.race ?? hero.race ?? "");
    const requiredClassId = String(existingHeroJson.classId ?? (hero as any).classId ?? hero.klass ?? "");
    const requiredKlass = String(existingHeroJson.klass ?? hero.klass ?? "");

    if (!requiredName || !requiredRace || (!requiredClassId && !requiredKlass)) {
      const current = getJSON<string | null>("l2_current_user", null);
      if (current) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          accounts[accIndex].hero = hero;
          setJSON("l2_accounts_v2", accounts);
        }
      }
      return;
    }

    const heroJsonToSave = {
      ...existingHeroJson,
      name: requiredName,
      race: requiredRace,
      classId: requiredClassId,
      klass: requiredKlass,
      ...(hero.gender ? { gender: String(hero.gender) } : {}),
      ...(hero.profession ? { profession: String(hero.profession) } : {}),
      level: Number(hero.level ?? existingHeroJson.level ?? 1),
      exp: Number(hero.exp ?? existingHeroJson.exp ?? 0),
      hp: Number(hero.hp ?? existingHeroJson.hp ?? 0),
      mp: Number(hero.mp ?? existingHeroJson.mp ?? 0),
      cp: Number(hero.cp ?? existingHeroJson.cp ?? 0),
      maxHp: Number((hero as any).baseMaxHp ?? hero.maxHp ?? existingHeroJson.maxHp ?? 0),
      maxMp: Number((hero as any).baseMaxMp ?? hero.maxMp ?? existingHeroJson.maxMp ?? 0),
      maxCp: Number((hero as any).baseMaxCp ?? hero.maxCp ?? existingHeroJson.maxCp ?? 0),
      mobsKilled: Number(currentMobsKilled),
      coinOfLuck: Number(hero.coinOfLuck ?? existingHeroJson.coinOfLuck ?? 0),
      premiumUntil: hero.premiumUntil ?? existingHeroJson.premiumUntil ?? undefined,
      skills: Array.isArray(hero.skills) ? hero.skills : (Array.isArray(existingHeroJson.skills) ? existingHeroJson.skills : []),
      heroBuffs: Array.isArray(uniqueBuffs) ? uniqueBuffs : [],
      inventory: Array.isArray(hero.inventory) ? hero.inventory : (Array.isArray(existingHeroJson.inventory) ? existingHeroJson.inventory : []),
      equipment: hero.equipment && typeof hero.equipment === 'object' ? hero.equipment : (existingHeroJson.equipment && typeof existingHeroJson.equipment === 'object' ? existingHeroJson.equipment : {}),
      ...(hero.equipmentEnchantLevels && Object.keys(hero.equipmentEnchantLevels).length > 0 ? { equipmentEnchantLevels: hero.equipmentEnchantLevels } : {}),
      activeDyes: Array.isArray(hero.activeDyes) && hero.activeDyes.length > 0 ? hero.activeDyes : (Array.isArray(existingHeroJson.activeDyes) ? existingHeroJson.activeDyes : []),
      dailyQuestsProgress: hero.dailyQuestsProgress && typeof hero.dailyQuestsProgress === "object" ? hero.dailyQuestsProgress : (existingHeroJson.dailyQuestsProgress ?? {}),
      dailyQuestsCompleted: Array.isArray(hero.dailyQuestsCompleted) ? hero.dailyQuestsCompleted : (existingHeroJson.dailyQuestsCompleted ?? []),
      dailyQuestsResetDate: hero.dailyQuestsResetDate ?? existingHeroJson.dailyQuestsResetDate ?? null,
    };

    const localExp = Number(hero.exp ?? 0);
    const localLevel = Number(hero.level ?? 1);
    const localSp = Number(hero.sp ?? 0);
    const { useHeroStore } = await import('../heroStore');
    const serverState = useHeroStore.getState().serverState;
    const serverExpKnown = serverState?.exp ?? null;
    const serverLevelKnown = serverState?.level ?? null;
    const serverSpKnown = serverState?.sp ?? null;
    const expToSend = serverExpKnown !== null ? Math.max(localExp, serverExpKnown) : localExp;
    const spToSend = serverSpKnown !== null ? Math.max(localSp, serverSpKnown) : localSp;
    const levelToSend = localLevel;

    const localCoinLuck = hero.coinOfLuck ?? 0;
    const serverCoinLuck = serverState?.coinLuck ?? null;
    const sendCoinLuck = serverCoinLuck === null || localCoinLuck >= serverCoinLuck;

    const updatePayload: Parameters<typeof updateCharacter>[1] = {
      heroJson: heroJsonToSave,
      level: levelToSend,
      exp: expToSend,
      sp: spToSend,
      adena: hero.adena,
      aa: hero.aa || 0,
      expectedRevision,
    };
    if (sendCoinLuck) (updatePayload as any).coinLuck = localCoinLuck;

    const updatedCharacter = await updateCharacter(characterStore.characterId, updatePayload);

    if (updatedCharacter) {
      const newRevision = (updatedCharacter as any).heroRevision || (updatedCharacter as any).revision;
      const serverExp = Number(updatedCharacter.exp ?? 0);
      const serverLevel = Number(updatedCharacter.level ?? 1);
      const serverSp = Number(updatedCharacter.sp ?? 0);
      const currentHero = useHeroStore.getState().hero;
      if (currentHero) {
        const clampedExp = Math.max(currentHero.exp ?? 0, serverExp);
        const clampedSp = Math.max(currentHero.sp ?? 0, serverSp);
        const clampedLevel = Math.max(currentHero.level ?? 1, serverLevel);
        const serverCoinLuck = Number((updatedCharacter as any).coinLuck ?? 0);
        useHeroStore.getState().applyServerSync(
          { heroRevision: newRevision, exp: clampedExp, sp: clampedSp, level: clampedLevel } as any,
          { exp: serverExp, level: clampedLevel, sp: serverSp, coinLuck: serverCoinLuck, heroRevision: newRevision, updatedAt: Date.now() }
        );
      }
    }

    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      const accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex !== -1) {
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
          heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
        };
        accounts[accIndex].hero = heroWithTimestamp;
        setJSON("l2_accounts_v2", accounts);
      }
    }
  } catch (error: any) {
    if (error?.status === 429 || (error?.message && (error.message.includes('rate_limit') || error.message.includes('Too Many Requests')))) {
      const retrySec = Number((error as any).retryAfter);
      const cooldownMs = (Number.isFinite(retrySec) && retrySec > 0 ? retrySec : 60) * 1000;
      try {
        const { setRateLimitCooldown } = await import('../heroStore');
        setRateLimitCooldown(cooldownMs);
      } catch (e) {}
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const savedBattle = loadBattle(hero.name);
        const battleBuffs = Array.isArray(savedBattle?.heroBuffs) ? savedBattle.heroBuffs : [];
        const jsonBuffs = Array.isArray((hero as any).heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs : [];
        const mergedBuffs = [...jsonBuffs, ...battleBuffs].filter((b: any, i: number, arr: any[]) =>
          arr.findIndex((x: any) => (x.id && b.id && x.id === b.id) || (!x.id && !b.id && x.name === b.name)) === i
        );
        const heroJson = {
          ...((hero as any).heroJson || {}),
          ...buildBackupHeroJson(hero),
          heroBuffs: mergedBuffs.length ? mergedBuffs : ((hero as any).heroJson?.heroBuffs ?? []),
        };
        const heroWithTimestamp = { ...hero, lastSavedAt: Date.now(), _rateLimitBackup: true, heroJson };
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
        }
      }
      return;
    }

    if (error?.status === 409 || (error?.message && (error.message.includes('revision_conflict') || error.message.includes('revision conflict')))) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        try {
          const characterStore = useCharacterStore.getState();
          const currentCharacter = await getCharacter(characterStore.characterId);
          if (currentCharacter) {
            const serverHeroJson = currentCharacter.heroJson || {};
            const localMobsKilled = (hero as any).mobsKilled ?? 0;
            const serverMobsKilled = serverHeroJson.mobsKilled ?? 0;
            const localExp = hero.exp ?? 0;
            const serverExp = serverHeroJson.exp ?? Number(currentCharacter.exp) ?? 0;
            const localSkills = hero.skills ?? [];
            const serverSkills = serverHeroJson.skills ?? [];
            const mergedMobsKilled = Math.max(localMobsKilled, serverMobsKilled);
            const mergedExp = Math.max(localExp, serverExp);
            const mergedSkills = [...serverSkills];
            localSkills.forEach((localSkill: any) => {
              const existing = mergedSkills.find((s: any) => s.id === localSkill.id);
              if (existing) {
                if (localSkill.level > existing.level) existing.level = localSkill.level;
              } else mergedSkills.push(localSkill);
            });
            const savedBattle = loadBattle(hero.name);
            const battleBuffs = savedBattle?.heroBuffs || [];
            const serverBuffs = Array.isArray(serverHeroJson.heroBuffs) ? serverHeroJson.heroBuffs : [];
            const localBuffs = Array.isArray((hero as any).heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs : [];
            const allBuffs = [...serverBuffs, ...localBuffs, ...battleBuffs];
            const now = Date.now();
            const buffMap = new Map<string, any>();
            allBuffs.forEach((buff: any) => {
              if (buff.expiresAt && typeof buff.expiresAt === 'number' && buff.expiresAt < now) return;
              const key = buff.id ? `id_${buff.id}` : `name_${buff.name || ''}`;
              const existing = buffMap.get(key);
              if (!existing) buffMap.set(key, { ...buff });
              else if (buff.expiresAt && existing.expiresAt && buff.expiresAt > existing.expiresAt) buffMap.set(key, { ...buff });
            });
            const mergedBuffs = Array.from(buffMap.values());
            const { cleanupBuffs } = await import('../battle/helpers');
            const cleanedBuffs = cleanupBuffs(mergedBuffs, now);
            const { useHeroStore } = await import('../heroStore');
            const currentHero = useHeroStore.getState().hero;
            if (currentHero) {
              const newRevision = (currentCharacter as any).heroRevision || (currentCharacter as any).revision;
              const serverLevel = Number(currentCharacter.level ?? 1);
              const serverSp = Number(currentCharacter.sp ?? 0);
              const mergedLevel = Math.max(currentHero.level ?? 1, serverLevel);
              const mergedHero = {
                ...currentHero,
                exp: mergedExp,
                level: mergedLevel,
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
              useHeroStore.getState().applyServerSync(mergedHero as any, {
                exp: mergedExp,
                level: mergedLevel,
                sp: serverSp,
                heroRevision: newRevision,
                updatedAt: Date.now(),
              });
              const heroToSave = useHeroStore.getState().hero;
              if (heroToSave) await saveHeroOnce(heroToSave);
              return;
            }
          }
        } catch (reloadError: any) {
          retryCount = MAX_RETRIES;
          if (typeof window !== 'undefined' && window.alert) {
            window.alert('Конфлікт версій персонажа. Будь ласка, оновіть сторінку (F5) для синхронізації.');
          }
        }
      } else {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Не вдалося зберегти дані через конфлікт версій. Будь ласка, оновіть сторінку (F5).');
        }
      }
      const current = getJSON<string | null>("l2_current_user", null);
      if (current && hero) {
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const accIndex = accounts.findIndex((a: any) => a.username === current);
        if (accIndex !== -1) {
          const heroWithTimestamp = {
            ...hero,
            lastSavedAt: Date.now(),
            _conflictBackup: true,
            heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
          };
          accounts[accIndex].hero = heroWithTimestamp;
          setJSON("l2_accounts_v2", accounts);
        }
      }
      return;
    }

    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      const accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex !== -1) {
        const heroWithTimestamp = {
          ...hero,
          lastSavedAt: Date.now(),
          heroJson: { ...((hero as any).heroJson || {}), ...buildBackupHeroJson(hero) },
        };
        accounts[accIndex].hero = heroWithTimestamp;
        setJSON("l2_accounts_v2", accounts);
      }
    }
  }
}
```

---

### 5. src/utils/stats/recalculateAllStats.ts

```typescript
import { calcBaseStats } from "./calcBaseStats";
import { calcResources } from "./calcResources";
import { calcCombatStats } from "./calcCombatStats";
import { applyPassiveSkillsToCombat, applyPassiveSkillsToResources } from "./applyPassiveSkills";
import { applyBaseStatGrowthByClass } from "./applyBaseStatGrowth";
import { computeBuffedMaxResources, applyBuffsToStats } from "../../state/battle/helpers";
import { getMaxResources } from "../../state/battle/helpers/getMaxResources";
import { getSkillDef } from "../../state/battle/loadout";
import type { BattleBuff } from "../../state/battle/types";

export function recalculateAllStats(hero: any, buffs: BattleBuff[] = []): RecalculatedStats {
  const originalBaseStats = hero.baseStatsInitial || hero.baseStats || calcBaseStats(hero.race || "Human", hero.klass || hero.profession || "Fighter");
  const level = hero.level || 1;
  let grownBaseStats = applyBaseStatGrowthByClass(originalBaseStats, level, hero.klass, hero.profession);
  if (hero.activeDyes && hero.activeDyes.length > 0) {
    grownBaseStats = { ...grownBaseStats };
    for (const dye of hero.activeDyes) {
      grownBaseStats[dye.statPlus] = (grownBaseStats[dye.statPlus] || 0) + dye.effect;
      grownBaseStats[dye.statMinus] = Math.max(3, (grownBaseStats[dye.statMinus] || 0) - dye.effect);
    }
  }

  const resources = calcResources(grownBaseStats, level, hero.equipment, hero.activeDyes);
  let combatStats = calcCombatStats(grownBaseStats, level, hero.equipment, hero.equipmentEnchantLevels, hero.activeDyes);
  const baseMax = getMaxResources(hero);
  const buffedMax = computeBuffedMaxResources(baseMax, buffs);
  const currentMaxHp = buffedMax.maxHp;
  let currentHp: number;
  if (hero.hp === undefined || hero.hp === null) currentHp = currentMaxHp;
  else if (hero.hp >= resources.maxHp) currentHp = currentMaxHp;
  else currentHp = Math.min(currentMaxHp, Math.max(0, hero.hp));

  const finalCombatStats = applyPassiveSkillsToCombat(combatStats, learnedSkills, buffs, currentHp, currentMaxHp, hero.equipment);
  const finalResources = applyPassiveSkillsToResources(resources, learnedSkills, [], hero.equipment);

  // 7. Clamp: newHP = min(oldHP, newMaxHP)
  const clampedResources = {
    ...finalResources,
    hp: Math.min(hero.hp ?? finalResources.maxHp, finalResources.maxHp),
    mp: Math.min(hero.mp ?? finalResources.maxMp, finalResources.maxMp),
    cp: Math.min(hero.cp ?? finalResources.maxCp, finalResources.maxCp),
  };

  const statsWithBuffsForDisplay = applyBuffsToStats(finalCombatStats, buffs);
  return {
    baseStats: grownBaseStats,
    originalBaseStats,
    resources: clampedResources,
    finalStats: statsWithBuffsForDisplay,
    baseFinalStats: finalCombatStats,
  };
}
```

---

### 6. src/utils/stats/calcResources.ts

```typescript
export interface Resources {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  cp: number;
  maxCp: number;
}

export function calcResources(
  baseStats: HeroBaseStats,
  level: number,
  equipment?: Record<string, string | null>,
  activeDyes?: Array<{ id: string; statPlus: string; statMinus: string; effect: number; grade: string }>
): Resources {
  const lvl = Math.max(1, level);
  const conBonus = 1 + (baseStats.CON - 40) * 0.01;
  const menBonus = 1 + (baseStats.MEN - 25) * 0.01;
  const baseHp = 200 + lvl * 56;
  const baseMp = 100 + lvl * 8;
  let maxHp = Math.round(baseHp * conBonus);
  let maxMp = Math.round(baseMp * menBonus);
  let maxCp = Math.round(maxHp * 0.6);
  // ... equipment bonuses, set bonuses, dyes ...
  maxHp = Math.max(1, maxHp);
  return {
    hp: 0,  // calcResources = формула MAX, не поточний стан
    maxHp,
    mp: 0,
    maxMp,
    cp: 0,
    maxCp,
  };
}
```

---

### 7. src/utils/stats/applyPassiveSkills.ts (applyPassiveSkillsToResources)

```typescript
export function applyPassiveSkillsToResources(
  resources: Resources,
  learnedSkills: any[],
  buffs: BattleBuff[] = [],
  equipment?: Record<string, string | null>
): Resources {
  let stats: any = { maxHp: resources.maxHp, maxMp: resources.maxMp, maxCp: resources.maxCp };
  for (const learned of learnedSkills) {
    // applySinglePassive for each passive skill
    stats = applySinglePassive(stats, skillDef, levelDef);
  }
  return {
    ...resources,
    maxHp: Math.max(1, Math.round(stats.maxHp ?? resources.maxHp)),
    maxMp: Math.max(1, Math.round(stats.maxMp ?? resources.maxMp)),
    maxCp: Math.max(1, Math.round(stats.maxCp ?? resources.maxCp)),
  };
}
```

---

### 8. src/state/battle/helpers/resources.ts

```typescript
export const computeBuffedMaxResources = (
  base: { maxHp: number; maxMp: number; maxCp: number },
  buffs: BattleBuff[]
) => {
  const applied = applyBuffsToStats(base, buffs);
  const maxHp = Math.max(1, Math.round((applied as any).maxHp ?? base.maxHp));
  const maxMp = Math.max(1, Math.round((applied as any).maxMp ?? base.maxMp));
  const maxCp = Math.max(1, Math.round((applied as any).maxCp ?? base.maxCp));
  return { maxHp, maxMp, maxCp };
};
```

---

### 9. src/state/battle/helpers/getMaxResources.ts

```typescript
export function getMaxResources(hero: HeroResourcesSource | null): { maxHp: number; maxMp: number; maxCp: number } {
  if (!hero) return { maxHp: 1, maxMp: 1, maxCp: 1 };
  const maxHp = hero.maxHp ?? hero.hp ?? 1;
  const maxMp = hero.maxMp ?? hero.mp ?? 1;
  const maxCp = hero.maxCp ?? Math.max(1, Math.round(maxHp * 0.6));
  return { maxHp: Math.max(1, maxHp), maxMp: Math.max(1, maxMp), maxCp };
}
```

---

### 10. src/components/StatusBars.tsx

*(Скорочено — ~305 рядків)*

Ключові рядки:
```typescript
const baseMax = getMaxResources(hero);
const battleBuffs = getCombinedBuffs();
const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, battleBuffs);
const hp = hero.hp ?? maxHp;
// Bar label="HP" value={hp} max={maxHp}
```

---

### 11. src/screens/MagicStatue.tsx

*(Скорочено — ~295 рядків)*

Ключові фрагменти:
- applyAllBufferBuffs: recalculateAllStats(currentHero, updatedBuffs), computeBuffedMaxResources(baseMax, updatedBuffs)
- newHp = wasFullHp ? newMaxHp : Math.min(newMaxHp, currentHero.hp ?? newMaxHp)
- updateHero({ maxHp: recalculated.resources.maxHp, hp: newHp, heroJson: { heroBuffs: updatedBuffs } })
- removeAllBufferBuffs: hp: Math.min(currentHero.hp, baseMax.maxHp)

---

### 12. src/state/battle/actions/useSkill/buffSkill.ts

*(Скорочено — ~380 рядків)*

Ключові рядки:
- `const curHeroHP = Math.min(maxHp, hero.hp ?? maxHp);`
- `const newHeroHP = Math.max(0, Math.min(maxHp, curHeroHP + healedFromMax + specialHpChange));`
- recalculateAllStats(heroWithNewHp, newBuffs)
- updateHero({ hp: newHeroHP, mp: newHeroMP, cp: ... })

---

## Backend

---

### 13. server/src/characters.ts (PUT + heal)

PUT /characters/:id:
- Валідація: level, exp, sp, aa, coinLuck не можна зменшувати; premiumUntil в heroJson clamp до не збільшення
- heroJson: clampedPremiumUntil = Math.min(clientPremiumUntil, oldPremiumUntil)
- updateData: heroJson, level, exp, sp, adena, aa, coinLuck

POST /characters/:id/heal (рядки 186–246):
```typescript
const maxHp = rawMaxHp > 100 ? rawMaxHp : Math.max(100, 150 + level * 12);
const currentHp = rawHp > 0 ? Math.min(rawHp, maxHp) : maxHp;
const newHp = Math.min(maxHp, currentHp + body.power);
```

---

### 14. server/prisma/schema.prisma (Character)

```prisma
model Character {
  id           String   @id @default(cuid())
  accountId    String
  name         String
  race         String
  classId      String
  sex          String
  level        Int      @default(1)
  exp          BigInt   @default(0)
  sp           Int      @default(0)
  adena        Int      @default(0)
  aa           Int      @default(0)
  coinLuck     Int      @default(0)
  heroJson     Json     @default("{}")
  nickColor    String?
  lastActivityAt DateTime @default(now()) @updatedAt
  bannedUntil  DateTime?
  blockedUntil DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  // ... relations
}
```

---

### 15. server/prisma/migrations/20260201180000_add_banned_blocked_until/migration.sql

```sql
-- AlterTable
ALTER TABLE "Character" ADD COLUMN "bannedUntil" TIMESTAMP(3);
ALTER TABLE "Character" ADD COLUMN "blockedUntil" TIMESTAMP(3);
```

---

### 16. server/prisma/migrations/20260111164808_mmo_init/migration.sql (фрагмент Character)

```sql
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" BIGINT NOT NULL DEFAULT 0,
    "sp" INTEGER NOT NULL DEFAULT 0,
    "adena" INTEGER NOT NULL DEFAULT 0,
    "aa" INTEGER NOT NULL DEFAULT 0,
    "coinLuck" INTEGER NOT NULL DEFAULT 0,
    "heroJson" JSONB NOT NULL DEFAULT '{}',
    ...
);
```

---

*Повний код усіх файлів у репозиторії. heroLoadAPI та heroPersistence скорочено через обсяг.*
