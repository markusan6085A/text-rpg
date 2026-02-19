import { getExpToNext, MAX_LEVEL } from "../../../../data/expTable";
import { calculateMagicDamage } from "../../../../data/skills/calculate/calculateMagicDamage";
import { calculatePhysicalDamage } from "../../../../data/skills/calculate/calculatePhysicalDamage";
import { useAutoShot } from "./shotHelpers";
import { useHeroStore } from "../../../heroStore";
import { addDailyProgress } from "../../../dailyQuestsProgress";
import { processMobDrops } from "../../helpers/processDrops";
import { clampChance, getCritMultiplier, XP_RATE, SONIC_FOCUS_ID, SONIC_CONSUMERS, SONIC_COST, FOCUSED_FORCE_ID, FOCUSED_FORCE_CONSUMERS, FOCUSED_FORCE_COST, MAX_FOCUSED_FORCE_STACKS, FOCUSED_FORCE_DURATION_MS, createCooldownEntry, checkSkillCritical, hasAutoSpoilActive } from "./helpers";
import { processSkillEffects } from "./skillEffects";
import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";
import { recalculateAllStats } from "../../../../utils/stats/recalculateAllStats";
import { setMobRespawn } from "../../mobRespawns";
import { canAttackWithBow, useArrow, isBowEquipped, getWeaponGrade } from "./arrowHelpers";
import { getWeaponTypeFromEquipment } from "../../../../utils/stats/applyPassiveSkills";
import { getPremiumMultiplier } from "../../../../utils/premium/isPremiumActive";

export function handleAttackSkill(
  skillId: number,
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  state: BattleState,
  hero: Hero,
  heroStats: any,
  mpCost: number,
  now: number,
  activeBuffs: any[],
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  cooldownMs: (baseSec?: number, isToggle?: boolean) => number,
  isMagic: boolean,
  isPhysical: boolean,
  critChance: number,
  critMult: number,
  updateHero: (partial: Partial<Hero>) => void,
  setAndPersist: (updates: Partial<BattleState>) => void,
  get: () => BattleState
): boolean {
  const isAttack = isMagic || isPhysical;
  if (!isAttack) {
    if (import.meta.env.DEV) {
      console.warn(`[handleAttackSkill] Skill ${skillId} (${def.name}) is not an attack skill. isMagic: ${isMagic}, isPhysical: ${isPhysical}`);
    }
    return false;
  }
  
  if (import.meta.env.DEV && skillId === 92) {
    console.log(`[Shield Stun] Processing skill ${skillId}:`, {
      isMagic,
      isPhysical,
      isAttack,
      power: levelDef.power,
      heroStats: { pAtk: heroStats?.pAtk, mAtk: heroStats?.mAtk },
      mobHP: state.mobHP,
    });
  }

  // Перевірка стріл для лука (якщо навик вимагає лук або одягнутий лук)
  const weaponType = getWeaponTypeFromEquipment(hero.equipment);
  const requiresBow = def.requiresWeapon === "bow" || weaponType === "bow";
  
  if (requiresBow) {
    const bowCheck = canAttackWithBow(hero);
    if (!bowCheck.canAttack) {
      setAndPersist({
        log: [bowCheck.message || "У вас нет стрел для лука!", ...state.log].slice(0, 30),
      });
      return false;
    }
  }

  const targetStats = {
    pDef: state.mob?.pDef ?? Math.round((state.mob?.level ?? 1) * 8 + (state.mob?.hp ?? 0) * 0.15),
    mDef: state.mob?.mDef ?? Math.round((state.mob?.level ?? 1) * 8 + (state.mob?.hp ?? 0) * 0.12),
  };

  // Заряди тільки якщо увімкнені на панелі
  const shotResult = useAutoShot(hero, isPhysical, isMagic, state.loadoutSlots ?? [], state.activeChargeSlots ?? []);
  
  // Використовуємо стрілу, якщо одягнутий лук або навик вимагає лук
  if (requiresBow && isBowEquipped(hero)) {
    const weaponId = hero.equipment?.weapon;
    const weaponGrade = getWeaponGrade(weaponId);
    if (weaponGrade) {
      const arrowResult = useArrow(hero, weaponGrade);
      if (arrowResult.success) {
        updateHero({ inventory: arrowResult.updatedInventory });
      }
    }
  }

  // Attack skills
  const damage = isMagic
    ? calculateMagicDamage(heroStats, targetStats, def, levelDef)
    : calculatePhysicalDamage(heroStats, targetStats, def, levelDef);
  
  // Застосовуємо множник від shot
  const damageWithShot = Math.round(damage * shotResult.multiplier);
  
  const isCrit = isAttack && Math.random() * 100 < critChance;
  const totalDamage = isCrit ? Math.round(damageWithShot * critMult) : damageWithShot;

  if (totalDamage > 0) {
    addDailyProgress("daily_damage", totalDamage);
  }

  // Обробляємо спеціальні ефекти скілу (stun, hold, sleep тощо)
  const skillEffects = processSkillEffects(def, levelDef);
  let mobStunnedUntil = state.mobStunnedUntil;
  if (skillEffects.stun?.applied) {
    mobStunnedUntil = now + skillEffects.stun.duration;
  }

  const nextMobHP = Math.max(0, state.mobHP - totalDamage);
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  // ❗ Читаємо поточні ресурси з hero.resources
  const currentHeroHP = Math.min(maxHp, hero.hp ?? maxHp);
  const currentHeroMP = Math.min(maxMp, hero.mp ?? maxMp);
  const currentHeroCP = Math.min(maxCp, hero.cp ?? maxCp);

  const nextHeroMP = currentHeroMP - mpCost;
  
  // Перевірка Skill Critical (Focus Skill Mastery) - шанс використати скіл без кулдауну
  const skillCritical = checkSkillCritical(heroStats, activeBuffs);
  const cooldownDuration = skillCritical ? 0 : cooldownMs(def.cooldown, false);
  const cooldownEntry = createCooldownEntry(skillId, cooldownDuration, now);
  const updatedCooldowns = { ...(get().cooldowns || {}), ...cooldownEntry };
  // Обробка крадіжки HP (vampirism) для attack skills
  // Для drain skills (Steal Essence, Life Drain) - пріоритет має vampirism зі скілу (80%)
  // Для інших скілів - спочатку перевіряємо vampirism з бафів, потім зі скілу
  const vampFromBuffs = heroStats?.vampirism ?? 0;
  const vampFromSkill = def.effects?.find((eff: any) => eff.stat === "vampirism")?.value ?? 0;
  // Для drain skills (Steal Essence 1245, Life Drain 1090) - завжди використовуємо vampirism зі скілу, якщо він є
  const isDrainSkill = skillId === 1245 || skillId === 1090;
  const vampPercent = isDrainSkill && vampFromSkill > 0 ? vampFromSkill : (vampFromBuffs > 0 ? vampFromBuffs : vampFromSkill);
  const healFromVamp = vampPercent > 0 ? Math.round(totalDamage * (vampPercent / 100)) : 0;
  const healedHeroHP = Math.min(maxHp, currentHeroHP + healFromVamp);
  
  // Спочатку визначаємо updatedBuffs (для SONIC_CONSUMERS та FOCUSED_FORCE_CONSUMERS)
  let updatedBuffs = activeBuffs;
  if (SONIC_CONSUMERS.has(skillId)) {
    const focusBuff = activeBuffs.find((b) => b.id === SONIC_FOCUS_ID);
    const stacks = focusBuff?.stacks ?? 0;
    const need = SONIC_COST[skillId] ?? 1;
    const newStacks = Math.max(0, stacks - need);
    const remainingFocus = newStacks > 0 ? { ...focusBuff, stacks: newStacks } : null;
    const withoutFocus = updatedBuffs.filter((b) => b.id !== SONIC_FOCUS_ID);
    updatedBuffs = remainingFocus ? [remainingFocus, ...withoutFocus] : withoutFocus;
  }
  
  if (FOCUSED_FORCE_CONSUMERS.has(skillId)) {
    const focusBuff = updatedBuffs.find((b) => b.id === FOCUSED_FORCE_ID);
    const stacks = focusBuff?.stacks ?? 0;
    const need = FOCUSED_FORCE_COST[skillId] ?? 1;
    const newStacks = Math.max(0, stacks - need);
    const remainingFocus = newStacks > 0 ? { ...focusBuff, stacks: newStacks } : null;
    const withoutFocus = updatedBuffs.filter((b) => b.id !== FOCUSED_FORCE_ID);
    updatedBuffs = remainingFocus ? [remainingFocus, ...withoutFocus] : withoutFocus;
  }
  
  // Force Rage (346) додає заряди Focused Force
  if (skillId === 346) {
    const focusBuff = updatedBuffs.find((b) => b.id === FOCUSED_FORCE_ID);
    const currentStacks = focusBuff?.stacks ?? 0;
    const newStacks = Math.min(MAX_FOCUSED_FORCE_STACKS, currentStacks + 1);
    const withoutFocus = updatedBuffs.filter((b) => b.id !== FOCUSED_FORCE_ID);
    const updatedFocus = {
      id: FOCUSED_FORCE_ID,
      name: focusBuff?.name || "Focused Force",
      icon: focusBuff?.icon || "/skills/skill0050.gif",
      stackType: focusBuff?.stackType,
      effects: focusBuff?.effects || [],
      expiresAt: focusBuff?.expiresAt || (now + FOCUSED_FORCE_DURATION_MS),
      startedAt: focusBuff?.startedAt || now,
      durationMs: FOCUSED_FORCE_DURATION_MS,
      stacks: newStacks,
    };
    updatedBuffs = [updatedFocus, ...withoutFocus];
  }
  
  // Перераховуємо стати після зміни HP через vampirism, щоб активувати/деактивувати пасивні скіли з hpThreshold
  const heroWithHealedHp = { ...hero, hp: healedHeroHP };
  const recalculatedHealed = recalculateAllStats(heroWithHealedHp, updatedBuffs);

  const newLog = [
    healFromVamp > 0
      ? `Вы использовали ${def.name} и восстановили ${Math.round(healFromVamp)} HP`
      : `Вы использовали ${def.name}`,
    isCrit 
      ? (isMagic ? `Магічний критичний удар! Ви наносите ${Math.round(totalDamage)} урона.` : `Критический удар! Вы наносите ${Math.round(totalDamage)} урона.`)
      : `Вы наносите ${Math.round(totalDamage)} урона.`,
    skillEffects.stun?.applied 
      ? `${state.mob?.name} оглушен на ${skillEffects.stun.duration / 1000} секунд!`
      : skillEffects.stun && !skillEffects.stun.applied
      ? `${state.mob?.name} устоял против оглушения.`
      : null,
    ...state.log,
  ].filter((msg) => msg !== null).slice(0, 30);

  if (nextMobHP <= 0) {
    const adenaGain = Math.round(
      ((state.mob?.adenaMin ?? 0) + (state.mob?.adenaMax ?? 0)) / 2
    );
    const expGain = state.mob?.exp ?? 0;
    const spGain = state.mob?.sp ?? 0;

    // Auto Spoil: if toggle is active, automatically spoil the mob
    const autoSpoilActive = hasAutoSpoilActive(updatedBuffs);
    const mobSpoiled = autoSpoilActive;

    // Дроп + адена + эксп + SP — один updateHero одразу
    const curHero = useHeroStore.getState().hero;
    let dropMessages: string[] = [];
    const victoryUpdates: Partial<Hero> = {};

    if (curHero && state.mob) {
      const dropResult = processMobDrops(state.mob, curHero, mobSpoiled);
      dropMessages = dropResult.dropMessages;
      if (dropResult.newInventory !== curHero.inventory || dropResult.zaricheEquipped) {
        victoryUpdates.inventory = dropResult.newInventory;
        if (dropResult.questProgressUpdates && dropResult.questProgressUpdates.length > 0) {
          const activeQuests = curHero.activeQuests || [];
          victoryUpdates.activeQuests = activeQuests.map((aq) => {
            const questUpdates = dropResult.questProgressUpdates?.filter((u) => u.questId === aq.questId) || [];
            if (questUpdates.length > 0) {
              const newProgress = { ...aq.progress };
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
      }
    }

    let leveled = false;
    let heroHpAfter = healedHeroHP;
    let heroCpAfter = hero.cp ?? 0;
    let heroMpAfter = nextHeroMP;
    let displayExp = expGain;
    let displaySp = spGain;
    let displayAdena = adenaGain;

    if (curHero) {
      const premiumMultiplier = getPremiumMultiplier(curHero);
      const finalExpGain = Math.round(expGain * XP_RATE * premiumMultiplier);
      const finalSpGain = Math.round(spGain * premiumMultiplier);
      const finalAdenaGain = Math.round(adenaGain * premiumMultiplier);
      displayExp = finalExpGain;
      displaySp = finalSpGain;
      displayAdena = finalAdenaGain;

      let level = Number(curHero.level ?? 1) || 1;
      let exp = Math.floor(Number(curHero.exp ?? 0)) + finalExpGain;
      const EPS = 0.001;
      while (exp >= getExpToNext(level, XP_RATE) - EPS) {
        const need = getExpToNext(level, XP_RATE);
        if (need <= 0) break;
        exp = Math.max(0, Math.floor(exp - need));
        level += 1;
        leveled = true;
        if (level >= MAX_LEVEL) {
          exp = 0;
          break;
        }
      }
      const updMaxHp = curHero.maxHp ?? curHero.hp ?? 0;
      const updMaxCp = curHero.maxCp ?? curHero.cp ?? 0;
      const updMaxMp = curHero.maxMp ?? curHero.mp ?? 0;
      if (leveled) newLog.unshift(`Повышение уровня! ${level}`);
      heroHpAfter = leveled ? updMaxHp : heroHpAfter;
      heroCpAfter = leveled ? updMaxCp : heroCpAfter;
      heroMpAfter = leveled ? updMaxMp : nextHeroMP;

      Object.assign(victoryUpdates, {
        level,
        exp,
        sp: (curHero.sp ?? 0) + finalSpGain,
        adena: (curHero.adena ?? 0) + finalAdenaGain,
        hp: heroHpAfter,
        mp: heroMpAfter,
        cp: heroCpAfter,
      });
      const heroWithNewHp = { ...curHero, ...victoryUpdates };
      const recalculatedAfter = recalculateAllStats(heroWithNewHp, updatedBuffs);
      victoryUpdates.battleStats = recalculatedAfter.finalStats;
      const completed = curHero.dailyQuestsCompleted ?? [];
      const cur = curHero.dailyQuestsProgress ?? {};
      const nextProgress: Record<string, number> = { ...cur };
      if (!completed.includes("daily_kills")) nextProgress.daily_kills = (cur.daily_kills ?? 0) + 1;
      if (!completed.includes("daily_adena_farm")) nextProgress.daily_adena_farm = (cur.daily_adena_farm ?? 0) + finalAdenaGain;
      (victoryUpdates as any).dailyQuestsProgress = nextProgress;
      useHeroStore.getState().updateHero(victoryUpdates);
    } else {
      const heroAfterLevel = useHeroStore.getState().hero;
      if (heroAfterLevel) {
        const heroWithNewHp = { ...heroAfterLevel, hp: heroHpAfter };
        const recalculatedAfter = recalculateAllStats(heroWithNewHp, updatedBuffs);
        updateHero({ hp: heroHpAfter, mp: heroMpAfter, cp: heroCpAfter, battleStats: recalculatedAfter.finalStats });
      } else {
        updateHero({ hp: heroHpAfter, mp: heroMpAfter, cp: heroCpAfter });
      }
    }

    // Встановлюємо респавн моба: 5 сек для риб (fishing зона), 30 секунд для звичайних, 10 хвилин для чемпіонів, respawnTime для РБ
    if (state.zoneId !== undefined && state.mobIndex !== undefined) {
      const heroName = useHeroStore.getState().hero?.name;
      const isRaidBoss = (state.mob as any)?.isRaidBoss === true;
      const isFishingZone = state.zoneId === "fishing";
      let respawnTime: number;
      if (isRaidBoss) {
        respawnTime = (state.mob as any)?.respawnTime ? (state.mob as any).respawnTime * 1000 : 6 * 60 * 60 * 1000; // respawnTime в секундах, переводимо в мс
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
      status: "victory",
      mobStunnedUntil: undefined, // Скидаємо stun при смерті моба
      log: [
        `${state.mob?.name} повержен.`,
        mobSpoiled ? `Auto Spoil: моб автоматически спойлен.` : null,
        `Добыча: +${displayExp} EXP, +${displaySp} SP, +${displayAdena} адены`,
        ...(dropMessages.length > 0 ? dropMessages : []),
        ...newLog,
      ].filter((msg) => msg !== null).slice(0, 30),
      cooldowns: updatedCooldowns,
      lastReward: { exp: displayExp, sp: displaySp, adena: displayAdena, mob: state.mob?.name ?? "", spoiled: mobSpoiled },
      heroBuffs: updatedBuffs,
    });
    return true;
  }

  // Оновлюємо battleStats якщо вони змінилися через зміну HP
  if (recalculatedHealed.finalStats.pAtk !== hero.battleStats?.pAtk ||
      recalculatedHealed.finalStats.mAtk !== hero.battleStats?.mAtk ||
      recalculatedHealed.finalStats.pDef !== hero.battleStats?.pDef ||
      recalculatedHealed.finalStats.mDef !== hero.battleStats?.mDef) {
    updateHero({ 
      hp: healedHeroHP, 
      mp: nextHeroMP, 
      cp: currentHeroCP,
      battleStats: recalculatedHealed.finalStats 
    });
  } else {
    updateHero({ 
      hp: healedHeroHP, 
      mp: nextHeroMP, 
      cp: currentHeroCP,
    });
  }
  
  setAndPersist({
    mobHP: nextMobHP,
    mobStunnedUntil, // Оновлюємо stun стан
    status: "fighting",
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: updatedBuffs,
  });
  return true;
}

