# Повний збірник: завантаження героя, battle persist, ресурси/бафи, тики

Один документ з картою та повним кодом файлів для діагностики HP/MP після F5 та на /battle.

---

## Карта (коротко)

| Секція | Файли |
|--------|--------|
| **A) Завантаження героя (F5)** | heroLoad.ts, heroLoadAPI.ts |
| **B) Battle persist** | battle/persist.ts |
| **C) Ресурси + бафи (maxHp, clamp)** | battle/helpers/resources.ts, getMaxResources.ts, buffs.ts |
| **D) Перерахунок статів** | utils/stats/recalculateAllStats.ts |
| **E) Тики на /battle** | Battle.tsx (useEffect), regenTick.ts, processMobAttack.ts |

---

## A) src/state/heroStore/heroLoad.ts

```ts
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
  if (getString("l2_progress")) {
    removeItem("l2_progress");
  }

  const username = getJSON<string | null>("l2_current_user", null);
  if (!username) return null;

  const accounts = getJSON<any[]>("l2_accounts_v2", []);
  if (!Array.isArray(accounts)) return null;

  let updated = false;
  accounts.forEach((acc: any) => {
    if (!acc.hero) return;
    const fixedHero = fixHeroProfession(acc.hero);
    if (fixedHero !== acc.hero) {
      acc.hero = fixedHero;
      updated = true;
    }
    if (fixedHero.inventory && Array.isArray(fixedHero.inventory)) {
      let inventoryUpdated = false;
      fixedHero.inventory.forEach((item: any) => {
        if (item.id === "s_angel_slayer" && item.stats?.pAtk === 581 && item.stats?.pAtkSpd === 293) {
          item.id = "s_draconic_bow";
          item.name = "Draconic Bow";
          item.icon = "/items/drops/weapon_s/weapon_draconic_bow_i00.png";
          item.description = "Драконовий Лук S-grade.";
          inventoryUpdated = true;
        }
      });
      if (inventoryUpdated) {
        acc.hero = fixedHero;
        updated = true;
      }
    }
  });
  if (updated) setJSON("l2_accounts_v2", accounts);

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
    (fixedHero as any).mobsKilled = (fixedHero as any).mobsKilled ?? heroJson.mobsKilled ?? heroJson.mobs_killed ?? 0;

    fixedHero.equipment = { ...((heroJson as any).equipment ?? {}), ...(fixedHero.equipment ?? {}) };
    fixedHero.equipmentEnchantLevels = { ...((heroJson as any).equipmentEnchantLevels ?? {}), ...(fixedHero.equipmentEnchantLevels ?? {}) };
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
    fixedHero.activeDyes = (Array.isArray(fixedHero.activeDyes) ? fixedHero.activeDyes : []).length >= (Array.isArray((heroJson as any).activeDyes) ? (heroJson as any).activeDyes : []).length ? (fixedHero.activeDyes ?? []) : ((heroJson as any).activeDyes ?? []);
    if ((fixedHero as any).dailyQuestsProgress === undefined && (heroJson as any).dailyQuestsProgress) (fixedHero as any).dailyQuestsProgress = (heroJson as any).dailyQuestsProgress;
    if ((fixedHero as any).dailyQuestsCompleted === undefined && Array.isArray((heroJson as any).dailyQuestsCompleted)) (fixedHero as any).dailyQuestsCompleted = (heroJson as any).dailyQuestsCompleted;
    if ((fixedHero as any).dailyQuestsResetDate === undefined && (heroJson as any).dailyQuestsResetDate) (fixedHero as any).dailyQuestsResetDate = (heroJson as any).dailyQuestsResetDate;
    const heroInv = fixedHero.inventory ?? [];
    const jsonInv = (heroJson as any).inventory ?? [];
    if (Array.isArray(heroInv) && Array.isArray(jsonInv)) fixedHero.inventory = heroInv.length >= jsonInv.length ? heroInv : jsonInv;
    else if (Array.isArray(jsonInv) && jsonInv.length > 0 && (!heroInv || heroInv.length === 0)) fixedHero.inventory = jsonInv;

    const currentBaseStats = fixedHero.baseStats;
    const hasCorruptedStats = currentBaseStats && (
      (currentBaseStats.STR > 100) || (currentBaseStats.DEX > 100) || (currentBaseStats.INT > 100) ||
      (currentBaseStats.WIT > 100) || (currentBaseStats.CON > 100) || (currentBaseStats.MEN > 100)
    );
    if (hasCorruptedStats) {
      const restoredBaseStats = calcBaseStats(fixedHero.race || "Human", fixedHero.klass || fixedHero.profession || "Fighter");
      fixedHero.baseStats = restoredBaseStats;
      fixedHero.baseStatsInitial = { ...restoredBaseStats };
    }
    if (!fixedHero.baseStatsInitial) fixedHero.baseStatsInitial = { ...fixedHero.baseStats };
    if (fixedHero.warehouseCapacity === undefined) fixedHero.warehouseCapacity = 100;

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
    const baseMax = { maxHp: recalculated.resources.maxHp, maxMp: recalculated.resources.maxMp, maxCp: recalculated.resources.maxCp };
    const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;

    const hpFull = Boolean((heroJson as any).hpFull);
    const mpFull = Boolean((heroJson as any).mpFull);
    const cpFull = Boolean((heroJson as any).cpFull);
    const finalHp = hpFull ? finalMaxHp : (fixedHero.hp === undefined || fixedHero.hp <= 0 || fixedHero.hp >= finalMaxHp ? finalMaxHp : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0)));
    const finalMp = mpFull ? finalMaxMp : (fixedHero.mp === undefined || fixedHero.mp <= 0 || fixedHero.mp >= finalMaxMp ? finalMaxMp : Math.min(finalMaxMp, Math.max(fixedHero.mp, 0)));
    const finalCp = cpFull ? finalMaxCp : (fixedHero.cp === undefined || fixedHero.cp <= 0 || fixedHero.cp >= finalMaxCp ? finalMaxCp : Math.min(finalMaxCp, Math.max(fixedHero.cp, 0)));

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

*(Стиснуто: міграції Angel Slayer по inventory та частина повторів опущені для стислості; логіка hp/mp/cp, loadBattle, cleanupBuffs, computeBuffedMaxResources, recalculateAllStats — повні.)*

---

## B) src/state/battle/persist.ts

```ts
import type { BattleState } from "./types";
import { getJSON, removeItem, setJSON } from "../persistence";

export const BATTLE_VERSION = 1;

export type PersistedBattleState = Partial<BattleState> & {
  version?: number;
};

const getBattleKey = (heroName?: string | null): string => {
  if (heroName) return `l2_battle_state_v7_${heroName}`;
  return "l2_battle_state_v7";
};

export const persistBattle = (data: Partial<BattleState>, heroName?: string | null) => {
  const key = getBattleKey(heroName);
  const dataWithHeroName = {
    ...data,
    heroName: heroName || data.heroName,
    version: BATTLE_VERSION,
  };
  setJSON(key, dataWithHeroName);
};

export const loadBattle = (heroName?: string | null): PersistedBattleState | null => {
  const currentHeroName = heroName ?? null;
  const key = getBattleKey(currentHeroName);
  const parsed = getJSON<PersistedBattleState | null>(key, null);

  if (!parsed || typeof parsed !== "object") {
    if (currentHeroName) {
      const oldKey = "l2_battle_state_v7";
      const oldParsed = getJSON<PersistedBattleState | null>(oldKey, null);
      if (oldParsed && typeof oldParsed === "object") {
        const migrated = { ...oldParsed, heroName: currentHeroName, version: BATTLE_VERSION };
        setJSON(key, migrated);
        removeItem(oldKey);
        return migrated;
      }
    }
    return null;
  }

  if (currentHeroName && parsed.heroName && parsed.heroName !== currentHeroName) {
    removeItem(key);
    return null;
  }

  if (parsed.version !== undefined && parsed.version !== BATTLE_VERSION) {
    removeItem(key);
    return null;
  }

  if (!parsed.version) {
    const migrated = { ...parsed, version: BATTLE_VERSION };
    setJSON(key, migrated);
    return migrated;
  }

  return parsed;
};

export const clearBattlePersist = (heroName?: string | null) => {
  removeItem(getBattleKey(heroName));
  removeItem("l2_battle_state_v7");
};
```

---

## C) src/state/battle/helpers/resources.ts

```ts
import type { BattleBuff } from "../types";
import { applyBuffsToStats } from "./buffs";

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

## C) src/state/battle/helpers/getMaxResources.ts

```ts
export type HeroResourcesSource = {
  maxHp?: number;
  maxMp?: number;
  maxCp?: number;
  hp?: number;
  mp?: number;
  cp?: number;
};

export function getMaxResources(
  hero: HeroResourcesSource | null
): { maxHp: number; maxMp: number; maxCp: number } {
  if (!hero) return { maxHp: 1, maxMp: 1, maxCp: 1 };
  const heroAny = hero as any;
  const baseMaxHp = Number(heroAny.baseMaxHp ?? heroAny.heroJson?.maxHp ?? hero.maxHp ?? hero.hp ?? 1);
  const baseMaxMp = Number(heroAny.baseMaxMp ?? heroAny.heroJson?.maxMp ?? hero.maxMp ?? hero.mp ?? 1);
  const baseMaxCp = Number(heroAny.baseMaxCp ?? heroAny.heroJson?.maxCp ?? hero.maxCp ?? Math.max(1, Math.round(baseMaxHp * 0.6)));
  return {
    maxHp: Math.max(1, baseMaxHp),
    maxMp: Math.max(1, baseMaxMp),
    maxCp: Math.max(1, baseMaxCp),
  };
}
```

---

## C) src/state/battle/helpers/buffs.ts

```ts
import type { BattleBuff } from "../types";

const DEFAULT_BASE_STATS: Record<string, number> = {
  atkSpeed: 200, attackSpeed: 200, crit: 4, critRate: 4, critPower: 50, critDamage: 50,
  mCrit: 4, skillCritRate: 4, mCritRate: 4, magicCritRate: 4,
};

export const cleanupBuffs = (buffs: BattleBuff[], now: number) => {
  const seenStack = new Set<string>();
  const seenId = new Set<number>();
  const seenName = new Set<string>();
  return buffs
    .filter((b) => b.expiresAt > now)
    .filter((b) => {
      const isToggleBuff = b.expiresAt === Number.MAX_SAFE_INTEGER;
      if (!isToggleBuff) return true;
      const hasStack = b.stackType ? seenStack.has(b.stackType) : false;
      const hasId = typeof b.id === "number" ? seenId.has(b.id) : false;
      const hasName = b.name ? seenName.has(b.name) : false;
      if (hasStack || hasId || hasName) return false;
      if (b.stackType) seenStack.add(b.stackType);
      if (typeof b.id === "number") seenId.add(b.id);
      if (b.name) seenName.add(b.name);
      return true;
    });
};

export const applyBuffsToStats = (stats: any, buffs: BattleBuff[]) => {
  const merged = { ...(stats || {}) };
  let invulnerable = false;
  if (typeof merged["attackSpeed"] === "number" && typeof merged["atkSpeed"] !== "number") merged["atkSpeed"] = merged["attackSpeed"];
  else if (typeof merged["atkSpeed"] === "number" && typeof merged["attackSpeed"] !== "number") merged["attackSpeed"] = merged["atkSpeed"];

  const percentBuffsByStat: Record<string, number> = {};
  const flatBuffsByStat: Record<string, number> = {};
  const multiplierBuffsByStat: Record<string, number> = {};

  buffs.forEach((b) => {
    b.effects.forEach((eff) => {
      const stat = eff.stat;
      let mode = eff.mode;
      if (!mode && (eff.multiplier !== undefined && eff.multiplier !== null)) mode = "multiplier";
      if (!mode) mode = "flat";
      const val = mode === "multiplier" ? (eff.multiplier ?? eff.value ?? 1) : (eff.value ?? 0);
      let targetStat = stat;
      if (stat === "critRate") targetStat = "crit";
      else if (stat === "mCritRate" || stat === "magicCritRate" || stat === "skillCritRate") targetStat = "mCrit";
      else if (stat === "attackSpeed") targetStat = "atkSpeed";
      else if (stat === "critDamage") targetStat = "critPower";
      if (!stat) return;
      if (stat === "invulnerable") { invulnerable = invulnerable || val === 1 || val === true; return; }
      if (typeof val !== "number") return;

      let current: number | undefined;
      if (stat === "attackSpeed" || stat === "atkSpeed") {
        current = typeof merged["atkSpeed"] === "number" ? merged["atkSpeed"] : typeof merged["attackSpeed"] === "number" ? merged["attackSpeed"] : typeof stats?.["atkSpeed"] === "number" ? stats["atkSpeed"] : typeof stats?.["attackSpeed"] === "number" ? stats["attackSpeed"] : undefined;
      } else {
        current = typeof merged[targetStat] === "number" ? merged[targetStat] : typeof stats?.[targetStat] === "number" ? stats[targetStat] : undefined;
      }

      if (mode === "percent") {
        const percentValue = val;
        if (stat === "skillCritRate" || stat === "vampirism" || stat === "critDamage") {
          flatBuffsByStat[targetStat] = (flatBuffsByStat[targetStat] || 0) + percentValue;
        } else {
          percentBuffsByStat[targetStat] = (percentBuffsByStat[targetStat] || 0) + percentValue;
        }
      } else if (mode === "multiplier") {
        multiplierBuffsByStat[targetStat] = (multiplierBuffsByStat[targetStat] || 1) * val;
      } else {
        flatBuffsByStat[targetStat] = (flatBuffsByStat[targetStat] || 0) + val;
      }
    });
  });

  Object.keys(multiplierBuffsByStat).forEach((targetStat) => {
    let baseValue: number;
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") {
      baseValue = typeof merged["atkSpeed"] === "number" ? merged["atkSpeed"] : typeof merged["attackSpeed"] === "number" ? merged["attackSpeed"] : typeof stats?.["atkSpeed"] === "number" ? stats["atkSpeed"] : typeof stats?.["attackSpeed"] === "number" ? stats["attackSpeed"] : 200;
    } else baseValue = typeof stats?.[targetStat] === "number" ? stats[targetStat] : (merged[targetStat] ?? 0);
    merged[targetStat] = baseValue * multiplierBuffsByStat[targetStat];
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") { merged["atkSpeed"] = merged[targetStat]; merged["attackSpeed"] = merged[targetStat]; }
    else if (targetStat === "critPower") merged["critDamage"] = merged[targetStat];
  });

  Object.keys(percentBuffsByStat).forEach((targetStat) => {
    const totalPercent = percentBuffsByStat[targetStat];
    let baseValue: number;
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") {
      baseValue = typeof merged["atkSpeed"] === "number" ? merged["atkSpeed"] : typeof merged["attackSpeed"] === "number" ? merged["attackSpeed"] : typeof stats?.["atkSpeed"] === "number" ? stats["atkSpeed"] : typeof stats?.["attackSpeed"] === "number" ? stats["attackSpeed"] : (DEFAULT_BASE_STATS[targetStat] ?? 200);
    } else if (targetStat === "critPower" || targetStat === "critDamage") {
      baseValue = typeof merged["critPower"] === "number" ? merged["critPower"] : typeof merged["critDamage"] === "number" ? merged["critDamage"] : typeof stats?.["critPower"] === "number" ? stats["critPower"] : typeof stats?.["critDamage"] === "number" ? stats["critDamage"] : (DEFAULT_BASE_STATS[targetStat] ?? 50);
    } else if (targetStat === "crit" || targetStat === "mCrit") {
      baseValue = typeof merged[targetStat] === "number" ? merged[targetStat] : typeof stats?.[targetStat] === "number" ? stats[targetStat] : (DEFAULT_BASE_STATS[targetStat] ?? 4);
    } else baseValue = typeof merged[targetStat] === "number" ? merged[targetStat] : typeof stats?.[targetStat] === "number" ? stats[targetStat] : (DEFAULT_BASE_STATS[targetStat] ?? 0);
    merged[targetStat] = baseValue * (1 + totalPercent / 100);
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") { merged["atkSpeed"] = merged[targetStat]; merged["attackSpeed"] = merged[targetStat]; }
    else if (targetStat === "critPower") merged["critDamage"] = merged[targetStat];
    else if (targetStat === "mCrit") { merged["skillCritRate"] = merged[targetStat]; merged["mCritRate"] = merged[targetStat]; merged["magicCritRate"] = merged[targetStat]; }
  });

  Object.keys(flatBuffsByStat).forEach((targetStat) => {
    const current = merged[targetStat] ?? (typeof stats?.[targetStat] === "number" ? stats[targetStat] : 0);
    merged[targetStat] = current + flatBuffsByStat[targetStat];
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") { merged["atkSpeed"] = merged[targetStat]; merged["attackSpeed"] = merged[targetStat]; }
    else if (targetStat === "crit") merged["critRate"] = merged[targetStat];
    else if (targetStat === "mCrit") { merged["skillCritRate"] = merged[targetStat]; merged["mCritRate"] = merged[targetStat]; merged["magicCritRate"] = merged[targetStat]; }
    else if (targetStat === "critPower") merged["critDamage"] = merged[targetStat];
  });

  if (invulnerable) merged.invulnerable = true;
  return merged;
};
```

---

## D) src/utils/stats/recalculateAllStats.ts

Повертає: `originalBaseStats`, `resources` (maxHp/maxMp/maxCp без бафів), `baseFinalStats`, `finalStats`. Використовує calcBaseStats, calcResources, calcCombatStats, applyPassiveSkillsToCombat/ToResources, getMaxResources, computeBuffedMaxResources, applyBuffsToStats. Повний оригінал: `src/utils/stats/recalculateAllStats.ts` (~291 рядок).

---

## E) src/screens/Battle.tsx — useEffect з тиками

```ts
// Таймер: атаки кожні 250мс, реген раз на 1000мс
const BATTLE_TICK_MS = 250;
const REGEN_TICK_MS = 1000;
React.useEffect(() => {
  const battleInterval = setInterval(() => {
    setNow(Date.now());
    if (status === "fighting") processMobAttack();
  }, BATTLE_TICK_MS);
  const regenInterval = setInterval(() => {
    if (status === "fighting") regenTick();
  }, REGEN_TICK_MS);
  return () => {
    clearInterval(battleInterval);
    clearInterval(regenInterval);
  };
}, [status, regenTick, processMobAttack]);
```

---

## E) src/state/battle/actions/regenTick.ts

Ключова логіка для HP/MP після F5:

- `getMaxResources(heroAfterTicks)` → baseMax.
- `computeBuffedMaxResources(baseMax, mergedHeroBuffs)` → maxHp, maxMp, maxCp.
- `curHP = Math.min(maxHp, heroAfterTicks.hp ?? maxHp)` (аналогічно MP, CP).
- `nextHP = Math.min(maxHp, curHP + hpRegen)` (реген з applyBuffsToStats(hero.battleStats, mergedHeroBuffs)).
- `recalculateAllStats(heroWithNewHp, mergedHeroBuffs)`; при зміні battleStats — `updateHero({ battleStats }, { persist: false })`.
- `updateHero({ hp: nextHP, mp: nextMP, cp: nextCP })`.
- `persistSnapshot(get, persistBattle, updates)`.

Повний файл: `src/state/battle/actions/regenTick.ts`.

---

## E) src/state/battle/actions/processMobAttack.ts

Ключова логіка для урону та HP:

- `getMaxResources(hero)` → baseMax; `computeBuffedMaxResources(baseMax, nextBuffs)` → maxHp, maxMp, maxCp.
- `curHeroHP = Math.min(maxHp, hero.hp ?? maxHp)` (аналогічно MP, CP).
- Після розрахунку урону: `nextHeroHP = Math.max(0, curHeroHP - heroDamage)`.
- `recalculateAllStats(heroWithNewHp, nextBuffsAfterDispel)`; потім `updateHero({ hp: nextHeroHP })` або `updateHero({ hp: nextHeroHP, battleStats })`.
- При Salvation: `updateHero({ hp: savedHP, mp: savedMP, cp, battleStats })`.
- При смерті: `updateHero({ hp: 0, battleStats, equipment, equipmentEnchantLevels, zaricheEquippedUntil, heroJson: { ...existingJson, heroBuffs: [] } })`.

Повний файл: `src/state/battle/actions/processMobAttack.ts`.

---

## heroLoadAPI.ts (стисло)

- loadHero() → hydrateHero(localHero).
- getCharacter(id) → character.
- Якщо localHasMoreProgress (бафи, lastSavedAt, exp, level, sp, adena, skills, mobsKilled): merge з loadBattle, cleanupBuffs, recalculateAllStats, computeBuffedMaxResources; mergedHero з clamp hp/mp/cp; return mergedHero.
- Інакше: fixedHero з character/heroJson, merge skills/equipment/inventory, savedBattle = loadBattle(name), merge buffs, savedBuffs = cleanupBuffs(uniqueBuffs, now), recalculated = recalculateAllStats(heroForRecalc, []), buffedMax = computeBuffedMaxResources(baseMax, savedBuffs), finalHp/finalMp/finalCp з hpFull/mpFull/cpFull та fillHp/fillMp/fillCp.
- heroWithRecalculatedStats, hydrateHero(), heroJson.heroBuffs = savedBuffs, updateServerState(), return hydratedHero.

Повний файл 576 рядків — у репозиторії `src/state/heroStore/heroLoadAPI.ts`.

---

Усі повні версії файлів у проєкті за шляхами з таблиці вище. Цей документ — зведення та ключові фрагменти для швидкого огляду.
