import { getExpToNext, MAX_LEVEL } from "../../../../data/expTable";
import { useHeroStore } from "../../../heroStore";
import { applyBuffsToStats, computeBuffedMaxResources } from "../../helpers";
import { calcAutoAttackInterval } from "../../../../utils/combatSpeed";
import { clampChance, getCritMultiplier, XP_RATE, hasAutoSpoilActive, hasWhirlwindAttackActive, type Setter } from "./helpers";
import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import { recalculateAllStats } from "../../../../utils/stats/recalculateAllStats";
import { locations as WORLD_LOCATIONS } from "../../../../data/world";
import type { Mob } from "../../../../data/world/types";
import { useAutoShot } from "./shotHelpers";
import { processMobDrops } from "../../helpers/processDrops";
import { setMobRespawn } from "../../mobRespawns";
import { canAttackWithBow, useArrow, getWeaponGrade } from "./arrowHelpers";
import { updateDailyQuestProgress } from "../../../../utils/dailyQuests/updateDailyQuestProgress";
import { getPremiumMultiplier } from "../../../../utils/premium/isPremiumActive";
import { itemsDB } from "../../../../data/items/itemsDB";

export function handleBaseAttack(
  state: BattleState,
  hero: Hero,
  now: number,
  activeBuffs: any[],
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  updateHero: (partial: Partial<Hero>) => void,
  setAndPersist: (updates: Partial<BattleState>) => void
): boolean {
  if (state.status !== "fighting" || !state.mob) return false;
  
  // Перевірка cooldown для auto-attack
  if (state.heroNextAttackAt && now < state.heroNextAttackAt) return false;
  
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  // ❗ Читаємо HP/MP/CP з hero.resources (єдине джерело правди)
  const curHeroHP = Math.min(maxHp, hero.hp ?? maxHp);
  const curHeroMP = Math.min(maxMp, hero.mp ?? maxMp);
  const curHeroCP = Math.min(maxCp, hero.cp ?? maxCp);

  // Перевірка стріл для лука (тільки якщо не риболовля)
  const isFishingZone = state.zoneId === "fishing";
  const bowCheck = !isFishingZone ? canAttackWithBow(hero) : { canAttack: true, grade: null };
  if (!bowCheck.canAttack) {
    setAndPersist({
      log: [bowCheck.message || "У вас нет стрел для лука!", ...state.log].slice(0, 30),
    });
    return false;
  }

  const buffedStats = applyBuffsToStats(hero.battleStats || {}, activeBuffs);
  // isFishingZone вже визначено вище
  
  let pAtk: number;
  let baseDmg: number;
  let physicalDamageMultiplier: number = 1.0;
  
  // Спеціальна логіка для риболовлі: урон тільки з удочки, без базових статів
  if (isFishingZone) {
    const weaponId = hero.equipment?.weapon;
    const rodItem = weaponId ? itemsDB[weaponId] : null;
    if (!rodItem) {
      setAndPersist({
        log: ["Помилка: удочка не знайдена!", ...state.log].slice(0, 30),
      });
      return false;
    }
    // Урон тільки з удочки (без базових статів)
    const rodPAtk = rodItem.stats?.pAtk ?? 1;
    const variance = 0.1;
    pAtk = rodPAtk;
    baseDmg = Math.max(1, Math.round(rodPAtk * (1 - variance + Math.random() * variance * 2)));
  } else {
    // Звичайна логіка для інших зон
    pAtk = buffedStats?.pAtk ?? 20;
    const variance = 0.1;
    
    // ❗ Для магів фізичний урон зменшується у 2 рази (50%)
    const isMage = (hero.klass || "").toLowerCase().includes("mystic") || 
                   (hero.klass || "").toLowerCase().includes("маг") ||
                   (hero.profession || "").toLowerCase().includes("mystic") ||
                   (hero.profession || "").toLowerCase().includes("elder") ||
                   (hero.profession || "").toLowerCase().includes("necromancer") ||
                   (hero.profession || "").toLowerCase().includes("warlock") ||
                   (hero.profession || "").toLowerCase().includes("prophet") ||
                   (hero.profession || "").toLowerCase().includes("shaman");
    
    physicalDamageMultiplier = isMage ? 0.5 : 1.0; // Маги наносять 50% фізичного урону
    baseDmg = Math.max(1, Math.round(pAtk * physicalDamageMultiplier * (1 - variance + Math.random() * variance * 2)));
  }
  
  const critChance = clampChance(buffedStats?.crit);
  const critMult = getCritMultiplier(buffedStats?.critPower ?? buffedStats?.critDamage);
  
  // Для риболовлі: споживаємо наживку замість стріл
  if (isFishingZone) {
    const hasLure = hero.inventory?.some(
      (item) => item.id === "gludio_fish_lure" && (item.count ?? 0) > 0
    );
    
    if (!hasLure) {
      setAndPersist({
        log: ["Немає наживки для риболовлі!", ...state.log].slice(0, 30),
        status: "idle",
        mob: undefined,
      });
      return false;
    }

    // Споживаємо наживку
    const updatedInventory = hero.inventory.map((item) => {
      if (item.id === "gludio_fish_lure" && (item.count ?? 0) > 0) {
        const newCount = (item.count ?? 1) - 1;
        return newCount > 0 ? { ...item, count: newCount } : null;
      }
      return item;
    }).filter(Boolean) as typeof hero.inventory;
    
    updateHero({ inventory: updatedInventory });
  }

  // Автоматичне використання soulshot (для фізичної атаки, але не для риб)
  const shotResult = !isFishingZone ? useAutoShot(hero, true, false) : { used: false, multiplier: 1.0 };
  
  // Використовуємо стрілу, якщо одягнутий лук (тільки не для риб)
  if (!isFishingZone && bowCheck.grade) {
    const arrowResult = useArrow(hero, bowCheck.grade);
    if (arrowResult.success) {
      updateHero({ inventory: arrowResult.updatedInventory });
    }
  }
  
  // Застосовуємо множник від shot (для риб множник = 1.0)
  const baseDmgWithShot = Math.round(baseDmg * shotResult.multiplier);
  
  // Обчислюємо захист моба (для риб захист = 0, тому урон не зменшується)
  let damage = baseDmgWithShot;
  if (!isFishingZone && state.mob) {
    const mobPDef = state.mob.pDef ?? Math.round((state.mob.level ?? 1) * 8 + (state.mob.hp ?? 0) * 0.15);
    // Формула захисту: урон зменшується залежно від співвідношення атаки та захисту
    // Використовуємо спрощену формулу для базової атаки
    const effectivePAtk = Math.max(1, pAtk);
    const effectivePDef = Math.max(1, mobPDef);
    
    // Якщо захист моба більший за атаку, урон зменшується
    // Формула: damage = baseDamage * (pAtk / (pAtk + pDef * 0.5))
    // Це дає більш реалістичне зменшення урону
    const defenseReduction = effectivePAtk / (effectivePAtk + effectivePDef * 0.5);
    // Мінімальний урон = 30% від базового
    const finalMultiplier = Math.max(0.3, Math.min(1.0, defenseReduction));
    damage = Math.max(1, Math.round(baseDmgWithShot * finalMultiplier));
  }
  
  const isCrit = Math.random() * 100 < critChance;
  damage = isCrit ? Math.round(damage * critMult) : damage;

  // Діагностика урону
  if (import.meta.env.DEV) {
    const mobPDef = !isFishingZone && state.mob 
      ? (state.mob.pDef ?? Math.round((state.mob.level ?? 1) * 8 + (state.mob.hp ?? 0) * 0.15))
      : 0;
    console.log(`[baseAttack] Damage calculation:`, {
      pAtk,
      physicalDamageMultiplier,
      baseDmg,
      shotResult: { used: shotResult.used, multiplier: shotResult.multiplier },
      baseDmgWithShot,
      mobPDef,
      defenseMultiplier: !isFishingZone && state.mob ? Math.max(0.2, Math.min(1.0, (Math.max(1, pAtk) / Math.max(1, mobPDef)) * 0.8 + 0.2)) : 1.0,
      isCrit,
      critMult,
      damage,
      mobHP: state.mobHP,
    });
  }

  // Оновлюємо прогрес щоденних завдань: урон
  const curHero = useHeroStore.getState().hero;
  if (curHero && damage > 0) {
    const updatedProgress = updateDailyQuestProgress(curHero, "daily_damage", damage);
    if (updatedProgress !== curHero.dailyQuestsProgress) {
      useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
    }
  }

  // Обробка крадіжки HP (vampirism) для базової атаки
  const vampirismPercent = buffedStats?.vampirism ?? 0;
  const healFromVamp = vampirismPercent > 0 ? Math.round(damage * (vampirismPercent / 100)) : 0;
  const nextHeroHP = Math.min(maxHp, curHeroHP + healFromVamp);
  
  // Перераховуємо стати після зміни HP через vampirism, щоб активувати/деактивувати пасивні скіли з hpThreshold
  const heroWithNewHp = { ...hero, hp: nextHeroHP };
  const recalculated = recalculateAllStats(heroWithNewHp, activeBuffs);
  
  // Оновлюємо battleStats якщо вони змінилися
  if (recalculated.finalStats.pAtk !== hero.battleStats?.pAtk ||
      recalculated.finalStats.mAtk !== hero.battleStats?.mAtk ||
      recalculated.finalStats.pDef !== hero.battleStats?.pDef ||
      recalculated.finalStats.mDef !== hero.battleStats?.mDef) {
    updateHero({ 
      hp: nextHeroHP,
      battleStats: recalculated.finalStats 
    });
  } else {
    updateHero({ hp: nextHeroHP });
  }

  const nextMobHP = Math.max(0, state.mobHP - damage);
  
  // Діагностика застосування урону
  if (import.meta.env.DEV) {
    console.log(`[baseAttack] Applying damage:`, {
      damage,
      currentMobHP: state.mobHP,
      nextMobHP,
    });
  }
  
  // Whirlwind Attack: cleave damage to nearby mobs (only for FortuneSeeker)
  const whirlwindActive = hasWhirlwindAttackActive(activeBuffs);
  const isFortuneSeeker = hero.profession === "dwarven_fighter_fortune_seeker";
  const cleaveDamage = (whirlwindActive && isFortuneSeeker) ? Math.round(baseDmg * 0.5) : 0; // 50% of base damage
  const cleaveTargets = (whirlwindActive && isFortuneSeeker) ? 3 : 0; // Up to 3 additional targets
  
  // Track cleave damage results
  let cleaveKills = 0;
  const cleaveLogs: string[] = [];
  
  if (whirlwindActive && isFortuneSeeker && cleaveDamage > 0 && state.zoneId && state.mobIndex !== undefined) {
    // Find zone and get all mobs
    const zone = WORLD_LOCATIONS.find(z => z.id === state.zoneId);
    if (zone && zone.mobs) {
      // Get nearby mobs (exclude current mob)
      const nearbyMobs = zone.mobs
        .map((mob, index) => ({ mob, index }))
        .filter(({ index }) => index !== state.mobIndex)
        .slice(0, cleaveTargets); // Take up to 3 nearest
      
      // Apply cleave damage to each nearby mob
      nearbyMobs.forEach(({ mob, index }) => {
        // Simulate damage - in real game this would check mob's current HP
        // For now, we'll assume mob has full HP and calculate if it would be killed
        const mobMaxHp = mob.hp ?? 100;
        const wouldKill = cleaveDamage >= mobMaxHp;
        
        if (wouldKill) {
          cleaveKills++;
          cleaveLogs.push(`Whirlwind Attack: убил ${mob.name} (урон: ${cleaveDamage})`);
        } else {
          const remainingHp = mobMaxHp - cleaveDamage;
          cleaveLogs.push(`Whirlwind Attack: наносит ${cleaveDamage} урона ${mob.name} (HP: ${remainingHp}/${mobMaxHp})`);
        }
      });
    }
  }
  
  let attackLog = healFromVamp > 0
    ? (isCrit ? `Критический удар! Вы наносите ${Math.round(damage)} урона и восстанавливаете ${Math.round(healFromVamp)} HP.` : `Вы наносите ${Math.round(damage)} урона и восстанавливаете ${Math.round(healFromVamp)} HP.`)
    : (isCrit ? `Критический удар! Вы наносите ${Math.round(damage)} урона.` : `Вы наносите ${Math.round(damage)} урона.`);
  
  // Add cleave damage logs
  if (cleaveLogs.length > 0) {
    attackLog += ` ${cleaveLogs.join(" ")}`;
  } else if (whirlwindActive && isFortuneSeeker && cleaveDamage > 0) {
    attackLog += ` Whirlwind Attack: наносит ${cleaveDamage} урона ${cleaveTargets} ближайшим врагам.`;
  }
  
  const newLog = [
    attackLog,
    ...state.log,
  ].filter((msg) => msg !== null).slice(0, 30);

  if (nextMobHP <= 0) {
    let adenaGain = Math.round(
      ((state.mob?.adenaMin ?? 0) + (state.mob?.adenaMax ?? 0)) / 2
    );
    let expGain = state.mob?.exp ?? 0;
    let spGain = state.mob?.sp ?? 0;

    // Whirlwind Attack: multiply loot if additional mobs were killed
    const lootMultiplier = (whirlwindActive && isFortuneSeeker && cleaveKills > 0) ? (1 + cleaveKills) : 1;
    if (lootMultiplier > 1) {
      adenaGain = Math.round(adenaGain * lootMultiplier);
      expGain = Math.round(expGain * lootMultiplier);
      spGain = Math.round(spGain * lootMultiplier);
    }

    // Auto Spoil: if toggle is active, automatically spoil the mob
    const autoSpoilActive = hasAutoSpoilActive(activeBuffs);
    const mobSpoiled = autoSpoilActive;

    // Обробляємо дропи та спойли
    const curHero = useHeroStore.getState().hero;
    let dropMessages: string[] = [];
    let newInventory = curHero?.inventory || [];
    
    if (curHero && state.mob) {
      const dropResult = processMobDrops(state.mob, curHero, mobSpoiled);
      newInventory = dropResult.newInventory;
      dropMessages = dropResult.dropMessages;
      
      // Оновлюємо інвентар
      if (dropResult.newInventory !== curHero.inventory || dropResult.zaricheEquipped) {
        const heroStore = useHeroStore.getState();
        const updates: Partial<Hero> = { inventory: dropResult.newInventory };
        
        // Оновлюємо прогрес квестів, якщо є квестові дропи
        if (dropResult.questProgressUpdates && dropResult.questProgressUpdates.length > 0) {
          const activeQuests = curHero.activeQuests || [];
          const updatedQuests = activeQuests.map((aq) => {
            // Знаходимо всі оновлення для цього квесту
            const questUpdates = dropResult.questProgressUpdates?.filter(
              (u) => u.questId === aq.questId
            ) || [];
            
            if (questUpdates.length > 0) {
              const newProgress = { ...aq.progress };
              questUpdates.forEach((update) => {
                const currentProgress = newProgress[update.itemId] || 0;
                newProgress[update.itemId] = currentProgress + update.count;
              });
              return {
                ...aq,
                progress: newProgress,
              };
            }
            return aq;
          });
          updates.activeQuests = updatedQuests;
        }
        
        // Оновлюємо екіпіровку та таймер Зарича, якщо він випав
        if (dropResult.zaricheEquipped && dropResult.zaricheEquippedUntil) {
          if (dropResult.newEquipment) {
            updates.equipment = dropResult.newEquipment;
          }
          if (dropResult.newEquipmentEnchantLevels) {
            updates.equipmentEnchantLevels = dropResult.newEquipmentEnchantLevels;
          }
          updates.zaricheEquippedUntil = dropResult.zaricheEquippedUntil;
        }
        
        heroStore.updateHero(updates);
      }
    }

    let leveled = false;
    let heroHpAfter = nextHeroHP; // Використовуємо nextHeroHP, який вже враховує крадіжку HP
    let heroCpAfter = curHeroCP;
    let heroMpAfter = curHeroMP;

    if (adenaGain || expGain || spGain) {
      if (curHero) {
        // Преміум множник
        const premiumMultiplier = getPremiumMultiplier(curHero);
        const finalExpGain = Math.round(expGain * XP_RATE * premiumMultiplier);
        const finalSpGain = Math.round(spGain * premiumMultiplier);
        const finalAdenaGain = Math.round(adenaGain * premiumMultiplier);

        let level = curHero.level ?? 1;
        let exp = (curHero.exp ?? 0) + finalExpGain;
        while (exp >= getExpToNext(level, XP_RATE)) {
          const need = getExpToNext(level, XP_RATE);
          if (need <= 0) break;
          exp -= need;
          level += 1;
          leveled = true;
          if (level >= MAX_LEVEL) {
            exp = 0;
            break;
          }
        }
        // Оновлюємо прогрес щоденних завдань: адена та вбиті моби
        const updatedProgress = updateDailyQuestProgress(curHero, "daily_adena_farm", finalAdenaGain);
        const updatedProgressKills = updateDailyQuestProgress(curHero, "daily_kills", 1);
        const combinedProgress = {
          ...updatedProgress,
          ...updatedProgressKills,
        };

        // 🔥 Оновлюємо mobsKilled в heroJson (для відображення в профілі)
        const currentMobsKilled = (curHero as any).mobsKilled ?? (curHero as any).mobs_killed ?? (curHero as any).killedMobs ?? (curHero as any).totalKills ?? 0;
        const newMobsKilled = currentMobsKilled + 1;
        
        useHeroStore.getState().updateHero({
          level,
          exp,
          sp: (curHero.sp ?? 0) + finalSpGain,
          adena: (curHero.adena ?? 0) + finalAdenaGain,
          dailyQuestsProgress: combinedProgress,
          mobsKilled: newMobsKilled, // 🔥 Додаємо mobsKilled для збереження в heroJson
        } as any);

        const updatedHero = useHeroStore.getState().hero;
        const updMaxHp = updatedHero?.maxHp ?? curHero.maxHp ?? curHero.hp ?? 0;
        const updMaxCp = updatedHero?.maxCp ?? curHero.maxCp ?? curHero.cp ?? 0;
        const updMaxMp = updatedHero?.maxMp ?? curHero.maxMp ?? curHero.mp ?? 0;

        if (leveled) newLog.unshift(`Повышение уровня! ${level}`);

        heroHpAfter = leveled ? updMaxHp : heroHpAfter;
        heroCpAfter = leveled ? updMaxCp : heroCpAfter;
        heroMpAfter = leveled ? updMaxMp : heroMpAfter;
      }
    }

    const maxAfter = computeMaxNow(activeBuffs);
    // Обчислюємо наступний auto-attack (навіть якщо моб мертвий, для майбутнього бою)
    // Для риболовлі: фіксований інтервал 0.4 сек (400 мс)
    const isFishingZoneVictory = state.zoneId === "fishing";
    const attackSpeed = buffedStats?.attackSpeed ?? buffedStats?.atkSpeed ?? 0;
    const autoAttackInterval = isFishingZoneVictory ? 400 : calcAutoAttackInterval(attackSpeed);
    const nextAutoAttackAt = now + autoAttackInterval;
    
    // Перераховуємо стати після зміни HP (через level up або інші причини)
    const heroAfterLevel = useHeroStore.getState().hero;
    if (heroAfterLevel) {
      const heroWithNewHp = { ...heroAfterLevel, hp: heroHpAfter };
      const recalculatedAfter = recalculateAllStats(heroWithNewHp, activeBuffs);
      updateHero({ 
        hp: heroHpAfter, 
        mp: heroMpAfter, 
        cp: heroCpAfter,
        battleStats: recalculatedAfter.finalStats 
      });
    } else {
      updateHero({ 
        hp: heroHpAfter, 
        mp: heroMpAfter, 
        cp: heroCpAfter,
      });
    }
    
    const lootMessages: (string | null)[] = [
      `${state.mob?.name} повержен.`,
      mobSpoiled ? `Auto Spoil: моб автоматически спойлен.` : null,
    ];
    
    // Add Whirlwind Attack loot multiplier message
    if (lootMultiplier > 1) {
      lootMessages.push(`Whirlwind Attack: добыча умножена на ${lootMultiplier} (убито ${cleaveKills} дополнительных врагов)`);
    }
    
    lootMessages.push(`Добыча: +${expGain} EXP, +${spGain} SP, +${adenaGain} адены`);
    
    // Додаємо повідомлення про дропи
    if (dropMessages.length > 0) {
      lootMessages.push(...dropMessages);
    }
    
    // Встановлюємо респавн моба: 5 сек для риб (fishing зона), 30 секунд для звичайних, 10 хвилин для чемпіонів, respawnTime для РБ
    if (state.zoneId !== undefined && state.mobIndex !== undefined) {
      const heroName = useHeroStore.getState().hero?.name;
      const isRaidBoss = (state.mob as any)?.isRaidBoss === true;
      const isFishingZone = state.zoneId === "fishing";
      let respawnTime: number;
      if (isRaidBoss) {
        respawnTime = (state.mob as any)?.respawnTime ? (state.mob as any).respawnTime * 1000 : 6 * 60 * 60 * 1000; // respawnTime в секундах, переводимо в мілісекунди
      } else if (isFishingZone) {
        respawnTime = 5000; // 5 сек для риб
      } else {
        const isChampion = state.mob?.name?.startsWith("[Champion]") || state.mob?.name?.startsWith("[Чемпион]");
        respawnTime = isChampion ? 600000 : 30000; // 10 хв для чемпіонів, 30 сек для звичайних
      }
      setMobRespawn(state.zoneId, state.mobIndex, respawnTime, heroName);
    }
    
    setAndPersist({
      mobHP: 0,
      heroNextAttackAt: nextAutoAttackAt,
      status: "victory",
      log: [
        ...lootMessages,
        ...newLog,
      ].filter((msg) => msg !== null),
      cooldowns: state.cooldowns,
      lastReward: { exp: expGain, sp: spGain, adena: adenaGain, mob: state.mob?.name ?? "", spoiled: mobSpoiled },
    });
    return true;
  }

  // Обчислюємо наступний auto-attack на основі attackSpeed
  // Для риболовлі: фіксований інтервал 0.4 сек (400 мс)
  // isFishingZone вже визначено на початку функції
  const attackSpeed = buffedStats?.attackSpeed ?? buffedStats?.atkSpeed ?? 0;
  const autoAttackInterval = isFishingZone ? 400 : calcAutoAttackInterval(attackSpeed);
  const nextAutoAttackAt = now + autoAttackInterval;

  // ❗ Оновлюємо ресурси в hero.resources (єдине джерело правди)
  // HP вже оновлено вище через vampirism
  updateHero({ 
    mp: curHeroMP,
    cp: curHeroCP,
  });
  
  setAndPersist({
    mobHP: nextMobHP,
    heroNextAttackAt: nextAutoAttackAt,
    status: "fighting",
    log: newLog,
    cooldowns: state.cooldowns,
  });
  return true;
}

