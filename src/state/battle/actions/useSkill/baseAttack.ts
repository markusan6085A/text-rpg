import { getExpToNext, MAX_LEVEL } from "../../../../data/expTable";
import { useHeroStore } from "../../../heroStore";
import { addDailyProgress } from "../../../dailyQuestsProgress";
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
import { getPremiumMultiplier } from "../../../../utils/premium/isPremiumActive";
import { itemsDB } from "../../../../data/items/itemsDB";
import { reportRaidBossKill } from "../../../../utils/api";
import { DAILY_QUESTS } from "../../../../data/dailyQuests";
import { getGameSettings } from "../../../../state/gameSettings";
import { MOB_DEFENSE_MULTIPLIER, EXP_GAIN_RATE, SP_GAIN_RATE, HERO_VS_MOB_DEFENSE_FACTOR } from "../../../../data/balance";

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
      (item) => (item.id === "gludio_fish_lure" || item.id === "shop_gludio_fish_lure") && (item.count ?? 0) > 0
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
      if ((item.id === "gludio_fish_lure" || item.id === "shop_gludio_fish_lure") && (item.count ?? 0) > 0) {
        const newCount = (item.count ?? 1) - 1;
        return newCount > 0 ? { ...item, count: newCount } : null;
      }
      return item;
    }).filter(Boolean) as typeof hero.inventory;
    
    updateHero({ inventory: updatedInventory });
  }

  // Заряди (soulshot) тільки якщо увімкнені на панелі
  const shotResult = !isFishingZone
    ? useAutoShot(hero, true, false, state.loadoutSlots ?? [], state.activeChargeSlots ?? [])
    : { used: false, multiplier: 1.0 };
  
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
    const mobPDefRaw = state.mob.pDef ?? Math.round((state.mob.level ?? 1) * 12);
    const mobPDef = Math.max(1, Math.round(mobPDefRaw * MOB_DEFENSE_MULTIPLIER));
    const effectivePAtk = Math.max(1, pAtk);
    const effectivePDef = Math.max(1, mobPDef);
    const defenseReduction = effectivePAtk / (effectivePAtk + effectivePDef * HERO_VS_MOB_DEFENSE_FACTOR);
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

  if (damage > 0) {
    addDailyProgress("daily_damage", damage);
  }
  const curHero = useHeroStore.getState().hero;

  // Обробка крадіжки HP (vampirism) для базової атаки
  const vampirismPercent = buffedStats?.vampirism ?? 0;
  const healFromVamp = vampirismPercent > 0 ? Math.round(damage * (vampirismPercent / 100)) : 0;
  const nextHeroHP = Math.min(maxHp, curHeroHP + healFromVamp);
  
  // Перераховуємо стати після зміни HP через vampirism, щоб активувати/деактивувати пасивні скіли з hpThreshold
  const heroWithNewHp = { ...hero, hp: nextHeroHP };
  const recalculated = recalculateAllStats(heroWithNewHp, activeBuffs);
  
  // Оновлюємо battleStats якщо вони змінилися
  if (recalculated.baseFinalStats.pAtk !== hero.battleStats?.pAtk ||
      recalculated.baseFinalStats.mAtk !== hero.battleStats?.mAtk ||
      recalculated.baseFinalStats.pDef !== hero.battleStats?.pDef ||
      recalculated.baseFinalStats.mDef !== hero.battleStats?.mDef) {
    updateHero({ 
      hp: nextHeroHP,
      battleStats: recalculated.baseFinalStats 
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

    // КРИТИЧНО: функціональний updateHero — базуємо оновлення на prev, щоб пізніші виклики (реген тощо) не затирали інвентар/exp/adena
    let dropMessages: string[] = [];
    let displayExp = expGain;
    let displaySp = spGain;
    let displayAdena = adenaGain;
    let curHeroForLog: Hero | null = null;

    useHeroStore.getState().updateHero((prev) => {
      const curHero = prev ?? useHeroStore.getState().hero;
      if (!curHero || !state.mob) return {};
      curHeroForLog = curHero;

      const dropResult = processMobDrops(state.mob, curHero, mobSpoiled);
      dropMessages = dropResult.dropMessages;

      const victoryUpdates: Partial<Hero> = { inventory: dropResult.newInventory };
      if (dropResult.questProgressUpdates && dropResult.questProgressUpdates.length > 0) {
        const baseActiveQuests = curHero.activeQuests || [];
        victoryUpdates.activeQuests = baseActiveQuests.map((aq) => {
          const questUpdates = dropResult.questProgressUpdates?.filter((u) => u.questId === aq.questId) || [];
          if (questUpdates.length > 0) {
            const newProgress = { ...(aq.progress || {}) };
            questUpdates.forEach((update) => {
              newProgress[update.itemId] = (newProgress[update.itemId] || 0) + update.count;
            });
            return { ...aq, progress: newProgress };
          }
          return aq;
        });
      }
      if (dropResult.zaricheEquipped && dropResult.zaricheEquippedUntil) {
        if (dropResult.newEquipment) victoryUpdates.equipment = dropResult.newEquipment;
        if (dropResult.newEquipmentEnchantLevels) victoryUpdates.equipmentEnchantLevels = dropResult.newEquipmentEnchantLevels;
        victoryUpdates.zaricheEquippedUntil = dropResult.zaricheEquippedUntil;
      }

      const premiumMultiplier = getPremiumMultiplier(curHero);
      const expEnabled = getGameSettings().expEnabled !== false;
      const finalExpGain = expEnabled ? Math.round(expGain * XP_RATE * premiumMultiplier * EXP_GAIN_RATE) : 0;
      const finalSpGain = Math.round(spGain * premiumMultiplier * SP_GAIN_RATE);
      // Якщо адена прийшла з таблиці дропу (Floran профіль або mob.drops) — використовуємо її, інакше з mob.adenaMin/Max
      const finalAdenaGain = (dropResult.adenaFromDrops != null && dropResult.adenaFromDrops > 0)
        ? dropResult.adenaFromDrops
        : Math.round(adenaGain * premiumMultiplier);
      displayExp = finalExpGain;
      displaySp = finalSpGain;
      displayAdena = finalAdenaGain;

      const completed = curHero.dailyQuestsCompleted ?? [];
      const cur = curHero.dailyQuestsProgress ?? {};
      const nextProgress: Record<string, number> = { ...cur };
      if (!completed.includes("daily_kills")) nextProgress.daily_kills = (cur.daily_kills ?? 0) + 1;
      if (!completed.includes("daily_adena_farm")) nextProgress.daily_adena_farm = (cur.daily_adena_farm ?? 0) + finalAdenaGain;

      const newCompleted = [...completed];
      let rewardAdena = 0;
      let rewardExp = 0;
      let rewardSp = 0;
      let rewardCoinOfLuck = 0;
      for (const q of DAILY_QUESTS) {
        if (nextProgress[q.id] >= q.target && !completed.includes(q.id)) {
          newCompleted.push(q.id);
          rewardAdena += q.rewards.adena ?? 0;
          rewardExp += expEnabled ? Math.round((q.rewards.exp ?? 0) * EXP_GAIN_RATE) : 0;
          rewardSp += Math.round((q.rewards.sp ?? 0) * SP_GAIN_RATE);
          rewardCoinOfLuck += q.rewards.coinOfLuck ?? 0;
        }
      }

      let level = Number(curHero.level ?? 1) || 1;
      let exp = Math.floor(Number(curHero.exp ?? 0)) + finalExpGain + rewardExp;
      const EPS = 0.001;
      let leveled = false;
      let levelUps = 0;
      const MAX_LEVEL_UPS_PER_TICK = 10;
      while (exp >= getExpToNext(level, XP_RATE) - EPS && levelUps < MAX_LEVEL_UPS_PER_TICK) {
        const need = getExpToNext(level, XP_RATE);
        if (need <= 0 || level >= MAX_LEVEL) {
          if (level >= MAX_LEVEL) exp = 0;
          break;
        }
        exp = Math.max(0, Math.floor(exp - need));
        level += 1;
        leveled = true;
        levelUps++;
      }
      const currentMobsKilled = (curHero as any).mobsKilled ?? (curHero as any).mobs_killed ?? (curHero as any).killedMobs ?? (curHero as any).totalKills ?? 0;
      const newMobsKilled = currentMobsKilled + 1;

      const updMaxHp = curHero.maxHp ?? curHero.hp ?? 0;
      const updMaxCp = curHero.maxCp ?? curHero.cp ?? 0;
      const updMaxMp = curHero.maxMp ?? curHero.mp ?? 0;
      if (leveled) newLog.unshift(`Повышение уровня! ${level}`);

      Object.assign(victoryUpdates, {
        level,
        exp,
        sp: (curHero.sp ?? 0) + finalSpGain + rewardSp,
        adena: (curHero.adena ?? 0) + finalAdenaGain + rewardAdena,
        mobsKilled: newMobsKilled,
        hp: leveled ? updMaxHp : nextHeroHP,
        mp: leveled ? updMaxMp : curHeroMP,
        cp: leveled ? updMaxCp : curHeroCP,
        dailyQuestsProgress: nextProgress,
        dailyQuestsCompleted: newCompleted,
        ...(rewardCoinOfLuck > 0 ? { coinOfLuck: ((curHero as any).coinOfLuck ?? 0) + rewardCoinOfLuck } : {}),
      } as Partial<Hero>);
      const heroWithNewHp = { ...curHero, ...victoryUpdates };
      const recalculatedAfter = recalculateAllStats(heroWithNewHp, activeBuffs);
      (victoryUpdates as any).battleStats = recalculatedAfter.baseFinalStats;

      return victoryUpdates;
    });

    const maxAfter = computeMaxNow(activeBuffs);
    const isFishingZoneVictory = state.zoneId === "fishing";
    const attackSpeed = buffedStats?.attackSpeed ?? buffedStats?.atkSpeed ?? 0;
    const autoAttackInterval = isFishingZoneVictory ? 400 : calcAutoAttackInterval(attackSpeed);
    const nextAutoAttackAt = now + autoAttackInterval;
    
    const lootMessages: (string | null)[] = [
      `${state.mob?.name} повержен.`,
      mobSpoiled ? `Auto Spoil: моб автоматически спойлен.` : null,
    ];
    
    // Add Whirlwind Attack loot multiplier message
    if (lootMultiplier > 1) {
      lootMessages.push(`Whirlwind Attack: добыча умножена на ${lootMultiplier} (убито ${cleaveKills} дополнительных врагов)`);
    }
    
    lootMessages.push(`Добыча: +${displayExp} EXP, +${displaySp} SP, +${displayAdena} адены`);
    
    // Додаємо повідомлення про дропи
    if (dropMessages.length > 0) {
      lootMessages.push(...dropMessages);
    }
    
    const isRaidBoss = (state.mob as any)?.isRaidBoss === true;
    
    // Встановлюємо респавн моба: 5 сек для риб (fishing зона), 30 секунд для звичайних, 10 хвилин для чемпіонів, respawnTime для РБ
    if (state.zoneId !== undefined && state.mobIndex !== undefined) {
      const heroName = useHeroStore.getState().hero?.name;
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
    
    // Фіксуємо вбивство raid boss в новинах
    if (isRaidBoss && curHeroForLog) {
      reportRaidBossKill({
        characterId: curHeroForLog.id,
        characterName: curHeroForLog.name,
        bossName: state.mob?.name || "",
        bossLevel: state.mob?.level,
        bossDrops: state.mob?.drops || [],
      }).catch((err) => {
        console.error("Error reporting raid boss kill:", err);
      });
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
      lastReward: { exp: displayExp, sp: displaySp, adena: displayAdena, mob: state.mob?.name ?? "", spoiled: mobSpoiled },
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

