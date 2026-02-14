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
    // Це предмети з id "s_angel_slayer", які мають стати лука (pAtk: 581, pAtkSpd: 293)
    if (fixedHero.inventory && Array.isArray(fixedHero.inventory)) {
      let inventoryUpdated = false;
      fixedHero.inventory.forEach((item: any) => {
        if (item.id === "s_angel_slayer" && item.stats) {
          // Перевіряємо, чи це лук за статами (pAtk: 581, pAtkSpd: 293)
          if (item.stats.pAtk === 581 && item.stats.pAtkSpd === 293) {
            // Замінюємо на правильний лук
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
      
      // 🔥 Джерело істини: hero.* має пріоритет над heroJson (не перетирати hero валідним значенням heroJson)
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
      // 🔥 КРИТИЧНО: Union-merge equipment і skills — ніколи не губити плащ/пояс/тату/доп. скіли після F5
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
      // Щоденні завдання — відновлюємо з heroJson при завантаженні з localStorage
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

      // Міграція: виправляємо предмети "Angel Slayer", які були куплені як лук
      if (fixedHero.inventory && Array.isArray(fixedHero.inventory)) {
        let inventoryUpdated = false;
        fixedHero.inventory.forEach((item: any) => {
          if (item.id === "s_angel_slayer" && item.stats) {
            // Перевіряємо, чи це лук за статами (pAtk: 581, pAtkSpd: 293)
            if (item.stats.pAtk === 581 && item.stats.pAtkSpd === 293) {
              // Замінюємо на правильний лук
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

    // Відновлюємо оригінальні базові стати, якщо вони були зіпсовані
    // Перевіряємо, чи baseStats виглядають як зрощені (дуже великі значення)
    const currentBaseStats = fixedHero.baseStats;
    const hasCorruptedStats = currentBaseStats && (
      (currentBaseStats.STR > 100) || 
      (currentBaseStats.DEX > 100) || 
      (currentBaseStats.INT > 100) ||
      (currentBaseStats.WIT > 100) ||
      (currentBaseStats.CON > 100) ||
      (currentBaseStats.MEN > 100)
    );
    
    // Якщо стати зіпсовані - відновлюємо оригінальні
    if (hasCorruptedStats) {
      const restoredBaseStats = calcBaseStats(
        fixedHero.race || "Human",
        fixedHero.klass || fixedHero.profession || "Fighter"
      );
      fixedHero.baseStats = restoredBaseStats;
      fixedHero.baseStatsInitial = { ...restoredBaseStats }; // Зберігаємо відновлені стати як оригінальні
    }
    
    // Зберігаємо оригінальні базові стати (якщо їх ще немає)
    if (!fixedHero.baseStatsInitial) {
      fixedHero.baseStatsInitial = { ...fixedHero.baseStats };
    }
    
    // Ініціалізуємо місткість складу, якщо її немає
    if (fixedHero.warehouseCapacity === undefined) {
      fixedHero.warehouseCapacity = 100;
    }
    
    // Перераховуємо стати при завантаженні героя з урахуванням бафів
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
    
    // ❗ ВАЖЛИВО: recalculated.resources.maxHp містить БАЗОВЕ значення БЕЗ бафів
    // Застосовуємо бафи для обчислення finalMaxHp з бафами
    const baseMax = {
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
    };
    const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
    
    // ❗ КАНОНІЧНЕ ПРАВИЛО: HP ніколи не зменшується при reload
    // finalMaxHp - це maxHp З бафами (для порівняння з hp)
    // Але hero.maxHp зберігаємо БЕЗ бафів (базове значення)
    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;
    
    // ❗ КАНОНІЧНЕ ПРАВИЛО: HP ніколи не зменшується при reload
    // Якщо hp >= maxHp (з бафами) або hp відсутнє/невалідне → встановлюємо hp = maxHp (з бафами)
    // Якщо hp < maxHp (з бафами) → залишаємо як є (НЕ зменшуємо)
    // Це гарантує, що якщо гравець був фул з бафами, він залишиться фул з бафами
    const finalHp =
      fixedHero.hp === undefined ||
      fixedHero.hp <= 0 ||
      fixedHero.hp >= finalMaxHp
        ? finalMaxHp
        : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0)); // Залишаємо як є, але не більше maxHp з бафами
    
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
    
    // ❗ hp і maxHp мають бути в одному просторі (обидва buffed), інакше clamp десь обріже hp
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
    
    // 🔥 Правило 2: Використовуємо hydrateHero для синхронізації heroJson
    const hydratedHero = hydrateHero(heroWithRecalculatedStats);
    
    // 🔥 ЄДИНЕ ДЖЕРЕЛО ПРАВДИ: НЕ пишемо hero в localStorage тут.
    // Запис hero робить тільки heroPersistence (при збереженні прогресу). Тут лише читаємо і нормалізуємо в пам'яті.
    // Інакше кожен loadHero() перезаписував би localStorage і міг би затерти новіший стан від heroPersistence.
    return hydratedHero || heroWithRecalculatedStats;
  }
  
  return null;
}

