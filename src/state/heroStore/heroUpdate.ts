import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { loadBattle } from "../battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import { filterBuffsForHeroProfession } from "../battle/loadout";
import type { Hero } from "../../types/Hero";
import { hydrateHero } from "./heroHydration";
import { getExpToNext, MAX_LEVEL, normalizeLevelExpPair } from "../../data/expTable";

/** Обчислює level і exp після level-up (QuestShop, адмін бонуси, тощо) */
function computeLevelFromExp(level: number, exp: number): { level: number; exp: number } {
  const XP_RATE = 1;
  const EPS = 0.001;
  let lvl = Math.max(1, level);
  let xp = Math.max(0, Math.floor(exp));
  while (lvl < MAX_LEVEL) {
    const need = getExpToNext(lvl, XP_RATE);
    if (need <= 0 || xp < need - EPS) break;
    xp = Math.max(0, Math.floor(xp - need));
    lvl += 1;
  }
  if (lvl >= MAX_LEVEL) xp = 0;
  return { level: lvl, exp: xp };
}

export function updateHeroLogic(
  prev: Hero,
  partial: Partial<Hero>
): Hero {
  // 🔥 Якщо передано тільки exp (QuestShop, адмін) — обчислюємо level з level-up
  if (partial.exp !== undefined && partial.exp !== null && partial.level === undefined) {
    const curLevel = Number(prev.level ?? 1);
    const newExp = Number(partial.exp);
    const { level, exp } = computeLevelFromExp(curLevel, newExp);
    (partial as any).level = level;
    (partial as any).exp = exp;
  }
  // ❗ ВАЖЛИВО: Завжди зберігаємо profession, race, gender, klass - вони не повинні втрататися
  // 🔥 mobsKilled також має зберігатися (для статистики)
  const newMobsKilled = (partial as any).mobsKilled !== undefined ? (partial as any).mobsKilled : (prev as any).mobsKilled;
  
  let updated = { 
    ...prev, 
    ...partial,
    // Гарантуємо, що базові поля не втрачаються
    profession: partial.profession !== undefined ? partial.profession : prev.profession,
    klass: partial.klass !== undefined ? partial.klass : prev.klass,
    race: partial.race !== undefined ? partial.race : prev.race,
    gender: partial.gender !== undefined ? partial.gender : prev.gender,
    // 🔥 mobsKilled зберігаємо, якщо передано
    mobsKilled: newMobsKilled,
  };
  
  // 🔥 Схема A: hero.* - єдине джерело істини
  // Оновлюємо hero.skills, hero.mobsKilled (якщо передано в partial)
  const newSkills = partial.skills !== undefined ? partial.skills : prev.skills;
  if (partial.skills !== undefined) {
    updated.skills = partial.skills;
  }
  if ((partial as any).mobsKilled !== undefined) {
    (updated as any).mobsKilled = (partial as any).mobsKilled;
  }

  // ❗ recalculateAllStats НІКОЛИ не повинен запускатися через hp/mp/cp
  // Він має запускатися ТІЛЬКИ при: level, skills, equipment, equipmentInserts, baseStats, profession, klass, equipmentEnchantLevels, activeDyes
  const needsRecalc =
    partial.level !== undefined ||
    partial.skills !== undefined ||
    partial.equipment !== undefined ||
    (partial as any).equipmentInserts !== undefined ||
    partial.baseStats !== undefined ||
    partial.profession !== undefined ||
    partial.klass !== undefined ||
    partial.equipmentEnchantLevels !== undefined ||
    partial.activeDyes !== undefined;

  // ❗ ВАЖЛИВО: Навіть якщо needsRecalc = false, ми все одно повинні валідувати hp/mp/cp
  // щоб вони не перевищували maxHp/maxMp/maxCp
  // ❗ hero.maxHp — базове без бафів; partial.hp може бути до buffedMax (хіл/реген під бафами)
  // Використовуємо buffedMax для clamp, щоб не втрачати HP при бафах
  if (!needsRecalc && (partial.hp !== undefined || partial.mp !== undefined || partial.cp !== undefined)) {
    const baseMax = { maxHp: prev.maxHp ?? 1, maxMp: prev.maxMp ?? 1, maxCp: prev.maxCp ?? 1 };
    let maxHp = baseMax.maxHp;
    let maxMp = baseMax.maxMp;
    let maxCp = baseMax.maxCp;
    if (updated.name) {
      const savedBattle = loadBattle(updated.name);
      const heroJsonBuffs = Array.isArray((prev as any).heroJson?.heroBuffs) ? (prev as any).heroJson.heroBuffs : [];
      const savedBuffs = Array.isArray(savedBattle?.heroBuffs) ? savedBattle.heroBuffs : [];
      const allBuffs = cleanupBuffs([...heroJsonBuffs, ...savedBuffs], Date.now());
      ({ maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, allBuffs));
    }
    if (partial.hp !== undefined) {
      updated.hp = Math.max(0, Math.min(maxHp, partial.hp));
    }
    if (partial.mp !== undefined) {
      updated.mp = Math.max(0, Math.min(maxMp, partial.mp));
    }
    if (partial.cp !== undefined) {
      updated.cp = Math.max(0, Math.min(maxCp, partial.cp));
    }
  }

  if (needsRecalc) {
    const now = Date.now();
    const savedBattle = updated.name ? loadBattle(updated.name) : null;
    const inBattle = savedBattle?.status && savedBattle.status !== "idle";

    // ✅ беремо бафи і з heroJson, і з battle (міський/статуя баф зберігається в heroJson)
    const heroJsonBuffs = Array.isArray((updated as any).heroJson?.heroBuffs)
      ? (updated as any).heroJson.heroBuffs
      : [];
    const savedBattleBuffs = (updated.name && savedBattle) ? (Array.isArray(savedBattle.heroBuffs) ? savedBattle.heroBuffs : []) : [];
    const allBuffsRaw = [...heroJsonBuffs, ...savedBattleBuffs];
    // ✅ дедуп "як у heroLoad" (по id/stackType/name і з max expiresAt)
    const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
    const bestByKey = new Map<string, any>();
    for (const b of allBuffsRaw) {
      const key = byKey(b);
      const cur = bestByKey.get(key);
      const exp = b.expiresAt ?? 0;
      if (!cur || (cur.expiresAt ?? 0) < exp) bestByKey.set(key, b);
    }
    const savedBuffs = filterBuffsForHeroProfession(
      updated,
      cleanupBuffs(Array.from(bestByKey.values()), now)
    );
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
    
    // ⭐ preserve HP/MP/CP percent when maxHp changes (reload/gameplay) — prev.hp може бути обрізаний до base
    const prevMaxHp = prev.maxHp ?? buffedMax.maxHp;
    const prevMaxMp = prev.maxMp ?? buffedMax.maxMp;
    const prevMaxCp = prev.maxCp ?? buffedMax.maxCp;
    const hpPercent = prevMaxHp > 0 ? Math.min(1, Math.max(0, (prev.hp ?? 0) / prevMaxHp)) : 1;
    const mpPercent = prevMaxMp > 0 ? Math.min(1, Math.max(0, (prev.mp ?? 0) / prevMaxMp)) : 1;
    const cpPercent = prevMaxCp > 0 ? Math.min(1, Math.max(0, (prev.cp ?? 0) / prevMaxCp)) : 1;
    const adjustedHp = partial.hp !== undefined ? partial.hp : Math.round(hpPercent * buffedMax.maxHp);
    const adjustedMp = partial.mp !== undefined ? partial.mp : Math.round(mpPercent * buffedMax.maxMp);
    const adjustedCp = partial.cp !== undefined ? partial.cp : Math.round(cpPercent * buffedMax.maxCp);
    const safeHp = adjustedHp === undefined || adjustedHp <= 0 ? buffedMax.maxHp : Math.min(buffedMax.maxHp, Math.max(0, adjustedHp));
    const safeMp = adjustedMp === undefined || adjustedMp <= 0 ? buffedMax.maxMp : Math.min(buffedMax.maxMp, Math.max(0, adjustedMp));
    const safeCp = adjustedCp === undefined || adjustedCp <= 0 ? buffedMax.maxCp : Math.min(buffedMax.maxCp, Math.max(0, adjustedCp));
    
    updated = {
      ...updated,
      baseStats: recalculated.originalBaseStats,
      maxHp: buffedMax.maxHp, // buffed — узгоджено з hp
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

  // 🔥 Щоденні завдання: partial.dailyQuestsProgress не губити після needsRecalc (перезапис updated)
  if ((partial as any).dailyQuestsProgress !== undefined && typeof (partial as any).dailyQuestsProgress === "object") {
    (updated as any).dailyQuestsProgress = (partial as any).dailyQuestsProgress;
  }
  // 🔥 Інвентар та активні квести з partial не губити (квестові дропи після кожного кіла)
  if (partial.inventory !== undefined && Array.isArray(partial.inventory)) {
    (updated as any).inventory = partial.inventory;
  }
  if ((partial as any).activeQuests !== undefined && Array.isArray((partial as any).activeQuests)) {
    (updated as any).activeQuests = (partial as any).activeQuests;
  }
  // 🔥 exp/level/adena з partial не губити при мерджі (перемога в бою, продаж у магазині)
  if (partial.exp !== undefined && partial.exp !== null) {
    (updated as any).exp = Number(partial.exp);
  }
  if (partial.level !== undefined && partial.level !== null) {
    (updated as any).level = Number(partial.level);
  }
  if (partial.adena !== undefined && partial.adena !== null) {
    const parsedAdena = Number(partial.adena);
    if (!Number.isNaN(parsedAdena)) {
      (updated as any).adena = parsedAdena;
    }
  }
  if (partial.sp !== undefined && partial.sp !== null) {
    const parsedSp = Number(partial.sp);
    if (!Number.isNaN(parsedSp)) {
      (updated as any).sp = parsedSp;
    }
  }
  // 🔥 location — зберігаємо в heroJson для відображення в профілі іншим гравцям
  if ((partial as any).location !== undefined) {
    const hj = (updated as any).heroJson || {};
    // Видаляємо всі можливі варіанти локації, щоб залишився тільки один правильний (або порожній)
    delete hj.currentLocation;
    delete hj.zone;
    (updated as any).heroJson = { ...hj, location: (partial as any).location };
    // Також оновлюємо на самому hero
    (updated as any).location = (partial as any).location;
  }

  // 🔥 EXP завжди сегмент поточного рівня; зайве переносимо в level-up (антидубль / некоректний merge)
  if ((updated as any).level != null && (updated as any).exp != null) {
    const n = normalizeLevelExpPair(
      Number((updated as any).level),
      Number((updated as any).exp)
    );
    (updated as any).level = n.level;
    (updated as any).exp = n.exp;
  }

  // 🔥 Правило 2: Використовуємо hydrateHero перед поверненням для гарантованої синхронізації
  const hydrated = hydrateHero(updated);
  const result = hydrated || updated;
  const finalHp = Number(result?.hp ?? 0);

  // 🔥 При кожному оживленні або збільшенні HP скидаємо isDead/deadAt у heroJson, щоб смерть не «липла»
  if (finalHp > 0) {
    const hj = (result as any).heroJson || {};
    (result as any).heroJson = {
      ...hj,
      ...((partial as any).heroJson || {}),
      isDead: false,
      deadAt: 0,
      heroBuffs: (partial as any).heroJson?.heroBuffs !== undefined
        ? (partial as any).heroJson.heroBuffs
        : (hj.heroBuffs ?? (prev as any).heroJson?.heroBuffs ?? []),
    };
  } else {
    const target = (result as any);
    const existingHeroJson = target.heroJson || {};
    const newHeroBuffs = (partial as any).heroJson?.heroBuffs !== undefined
      ? (partial as any).heroJson.heroBuffs
      : (existingHeroJson.heroBuffs || (prev as any).heroJson?.heroBuffs || []);
    target.heroJson = {
      ...existingHeroJson,
      ...((partial as any).heroJson || {}),
      heroBuffs: newHeroBuffs,
    };
  }

  return result;
}

