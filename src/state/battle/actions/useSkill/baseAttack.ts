import { useHeroStore } from "../../../heroStore";
import { addDailyProgress } from "../../../dailyQuestsProgress";
import { applyBuffsToStats, computeBuffedMaxResources } from "../../helpers";
import { calcAutoAttackInterval } from "../../../../utils/combatSpeed";
import { clampChance, getCritMultiplier, hasWhirlwindAttackActive, type Setter } from "./helpers";
import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import { recalculateAllStats } from "../../../../utils/stats/recalculateAllStats";
import { locations as WORLD_LOCATIONS } from "../../../../data/world";
import type { Mob } from "../../../../data/world/types";
import { useAutoShot } from "./shotHelpers";
import { canAttackWithBow, useArrow, getWeaponGrade } from "./arrowHelpers";
import { getWeaponTypeFromEquipment } from "../../../../utils/stats/applyPassiveSkills";
import { itemsDB } from "../../../../data/items/itemsDB";
import { L2_PHYSICAL_COEFFICIENT, L2_PVE_DAMAGE_MULTIPLIER } from "../../../../data/balance";
import { getMobTargetStatsForHeroDamage } from "../../helpers/mobTargetStats";
import { commitMobVictoryToHeroStore } from "../../commitMobVictory";
import { buildVictoryResourceLogLines } from "../../helpers/victoryLootLogLines";
import { mobSpGainFromMob } from "../../mobSpGain";

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

  // 🔥 Захист: якщо battleStats порожні або без pAtk/mAtk/castSpeed — перераховуємо (фікс урону, швидкості касту)
  let heroForStats = hero;
  const bs = hero.battleStats;
  const needsStatsRecalc = !bs || (bs.pAtk ?? 0) < 1 || (bs.mAtk ?? 0) < 1 || (bs.castSpeed ?? 0) < 1;
  if (needsStatsRecalc) {
    const recalculated = recalculateAllStats(hero, activeBuffs);
    updateHero({ battleStats: recalculated.baseFinalStats });
    heroForStats = { ...hero, battleStats: recalculated.baseFinalStats };
  }

  const buffedStats = applyBuffsToStats(heroForStats.battleStats || {}, activeBuffs);
  // isFishingZone вже визначено вище
  
  let pAtk: number;
  let baseDmg: number;
  let physicalDamageMultiplier: number = 1.0;
  
  // Спеціальна логіка для риболовлі: урон тільки з удочки, без базових статів
  if (isFishingZone) {
    const eq = hero.equipment ?? {};
    const rodId = eq.weapon ?? eq.shield ?? eq.lrhand;
    const isRod = (id: string | undefined) => id === "baby_duck_rod" || id === "shop_baby_duck_rod" || (id && id.toLowerCase().includes("rod"));
    const canonicalId = rodId?.replace(/^shop_/, "") || rodId;
    const rodItem = rodId && isRod(rodId) ? (itemsDB[rodId] ?? itemsDB[canonicalId]) : null;
    if (!rodItem) {
      setAndPersist({
        log: ["Помилка: удочка не знайдена! Надіньте удочку в слот зброї.", ...state.log].slice(0, 30),
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
  const baseCritMult = getCritMultiplier(buffedStats?.critPower ?? buffedStats?.critDamage);
  const lsAnger = buffedStats?.lsAnger ?? 0;
  const critMult = baseCritMult * (1 + lsAnger / 100);
  
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

  // Обчислюємо урон (L2-стиль: damage = 70*pAtk/pDef для базової атаки)
  let damage = baseDmgWithShot;
  if (!isFishingZone && state.mob) {
    const { pDef: mobPDef } = getMobTargetStatsForHeroDamage(state.mob, state.mobBuffs, now);
    const effectivePAtk = Math.max(1, pAtk * physicalDamageMultiplier * shotResult.multiplier);
    // L2 формула: 70 * pAtk / pDef; L2_PVE_DAMAGE_MULTIPLIER компенсує MOB_HP/DEF
    const variance = 0.9 + Math.random() * 0.2;
    damage = Math.max(1, Math.round(
      L2_PHYSICAL_COEFFICIENT * effectivePAtk / mobPDef * variance * L2_PVE_DAMAGE_MULTIPLIER
    ));
  }
  
  const isCrit = Math.random() * 100 < critChance;
  damage = isCrit ? Math.round(damage * critMult) : damage;
  const lsBackbiting = buffedStats?.lsBackbiting ?? 0;
  if (lsBackbiting > 0) damage = Math.round(damage * (1 + lsBackbiting / 100));

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

  // Обробка крадіжки HP (vampirism); Vampiric Rage скрол — лише ближній бій (без лука)
  const weaponTypeBa = getWeaponTypeFromEquipment(hero.equipment);
  const vampMelee = weaponTypeBa !== "bow" ? (buffedStats?.vampirismMelee ?? 0) : 0;
  const vampirismPercent = (buffedStats?.vampirism ?? 0) + vampMelee;
  const totalVamp = vampirismPercent;
  const healFromVamp = totalVamp > 0 ? Math.round(damage * (totalVamp / 100)) : 0;
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
  const cleaveDamage = (whirlwindActive && isFortuneSeeker) ? Math.round(damage * 0.5) : 0; // 50% of actual damage to main target
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
    ? (isCrit
        ? `Критический удар! Вы наносите ${Math.round(damage)} и восстанавливаете ${Math.round(healFromVamp)} HP.`
        : `Вы наносите ${Math.round(damage)} и восстанавливаете ${Math.round(healFromVamp)} HP.`)
    : (isCrit ? `Критический удар! Вы наносите ${Math.round(damage)}.` : `Вы наносите ${Math.round(damage)}.`);
  
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
    if (!state.mob) return false;
    let adenaGain = Math.round(
      ((state.mob.adenaMin ?? 0) + (state.mob.adenaMax ?? 0)) / 2
    );
    let expGain = state.mob.exp ?? 0;
    let spGain = mobSpGainFromMob(state.mob);

    // Whirlwind Attack: multiply loot if additional mobs were killed
    const lootMultiplier = (whirlwindActive && isFortuneSeeker && cleaveKills > 0) ? (1 + cleaveKills) : 1;
    if (lootMultiplier > 1) {
      adenaGain = Math.round(adenaGain * lootMultiplier);
      expGain = Math.round(expGain * lootMultiplier);
      spGain = Math.round(spGain * lootMultiplier);
    }

    const v = commitMobVictoryToHeroStore({
      mob: state.mob,
      heroBuffs: activeBuffs,
      postVictoryHp: nextHeroHP,
      postVictoryMp: curHeroMP,
      postVictoryCp: curHeroCP,
      rewardOverrides: { adenaGain, expGain, spGain },
      zoneId: state.zoneId,
      mobIndex: state.mobIndex,
    });
    const { displayExp, displaySp, displayAdena, dropMessages, mobSpoiled, levelUpMessage, partyMemberLootLines } =
      v;
    if (levelUpMessage) newLog.unshift(levelUpMessage);

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
    
    const [lootLine1, lootLine2] = buildVictoryResourceLogLines(
      hero.name ?? "Герой",
      displayExp,
      displaySp,
      displayAdena
    );
    lootMessages.push(lootLine1, lootLine2);
    
    // Додаємо повідомлення про дропи
    if (dropMessages.length > 0) {
      lootMessages.push(...dropMessages);
    }
    if (partyMemberLootLines.length > 0) {
      lootMessages.push(...partyMemberLootLines);
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
      lastReward: {
        exp: displayExp,
        sp: displaySp,
        adena: displayAdena,
        mob: state.mob?.name ?? "",
        spoiled: mobSpoiled,
        mobAggressivePatrol: state.mob?.aggressivePatrol === true,
      },
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

