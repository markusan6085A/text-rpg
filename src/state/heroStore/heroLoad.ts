import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { fixHeroProfession } from "../../utils/fixProfession";
import { loadBattle } from "../battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import { getJSON, getString, removeItem, setJSON } from "../persistence";
import type { Hero } from "../../types/Hero";

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
      const { calcBaseStats } = require("../../utils/stats/calcBaseStats");
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
    const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
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
    
    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      baseStats: recalculated.originalBaseStats, // Оригінальні базові стати (не зрощені)
      baseStatsInitial: fixedHero.baseStatsInitial || recalculated.originalBaseStats, // Зберігаємо оригінальні
      battleStats: recalculated.finalStats,
      // ❗ ВАЖЛИВО: hero.maxHp має містити БАЗОВЕ значення БЕЗ бафів
      // Бафи застосовуються в computeBuffedMaxResources при використанні
      maxHp: recalculated.resources.maxHp, // Базове значення БЕЗ бафів
      maxMp: recalculated.resources.maxMp, // Базове значення БЕЗ бафів
      maxCp: recalculated.resources.maxCp, // Базове значення БЕЗ бафів
      // ❗ hp/mp/cp можуть бути з урахуванням бафів (якщо були фул з бафами)
      hp: finalHp,
      mp: finalMp,
      cp: finalCp,
    };
    
    // ❗ ВАЖЛИВО: Завжди зберігаємо hero після перерахунку, навіть якщо стати не змінилися
    // Ресурси (HP/MP/CP/maxHp/maxMp/maxCp) можуть змінитися навіть якщо бойові стати не змінилися
    // Це гарантує, що при наступному F5 буде завантажено правильні значення
    const accIndex = accounts.findIndex((a: any) => a.username === username);
    if (accIndex !== -1) {
      accounts[accIndex].hero = heroWithRecalculatedStats;
      setJSON("l2_accounts_v2", accounts);
    }
    
    return heroWithRecalculatedStats;
  }
  
  return null;
}

