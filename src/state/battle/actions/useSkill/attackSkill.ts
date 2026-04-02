import { calculateMagicDamage } from "../../../../data/skills/calculate/calculateMagicDamage";
import { calculatePhysicalDamage } from "../../../../data/skills/calculate/calculatePhysicalDamage";
import { useAutoShot } from "./shotHelpers";
import { addDailyProgress } from "../../../dailyQuestsProgress";
import { clampChance, getCritMultiplier, SONIC_FOCUS_ID, SONIC_CONSUMERS, SONIC_COST, FOCUSED_FORCE_ID, FOCUSED_FORCE_CONSUMERS, FOCUSED_FORCE_COST, MAX_FOCUSED_FORCE_STACKS, FOCUSED_FORCE_DURATION_MS, createCooldownEntry, checkSkillCritical } from "./helpers";
import { processSkillEffects } from "./skillEffects";
import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";
import { recalculateAllStats } from "../../../../utils/stats/recalculateAllStats";
import { commitMobVictoryToHeroStore } from "../../commitMobVictory";
import { buildVictoryResourceLogLines } from "../../helpers/victoryLootLogLines";
import { mobSpGainFromMob } from "../../mobSpGain";
import { canAttackWithBow, useArrow, isBowEquipped, getWeaponGrade } from "./arrowHelpers";
import { getWeaponTypeFromEquipment } from "../../../../utils/stats/applyPassiveSkills";
import { getMobTargetStatsForHeroDamage } from "../../helpers/mobTargetStats";

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

  const targetStats = state.mob
    ? getMobTargetStatsForHeroDamage(state.mob, state.mobBuffs, now)
    : { pDef: 1, mDef: 1, fireResist: 0, waterResist: 0, windResist: 0, earthResist: 0, holyResist: 0, darkResist: 0 };

  // Заряди тільки якщо увімкнені на панелі (ударний скіл = 2 заряди)
  const shotResult = useAutoShot(hero, isPhysical, isMagic, state.loadoutSlots ?? [], state.activeChargeSlots ?? [], 2);
  
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
  let damage = isMagic
    ? calculateMagicDamage(heroStats, targetStats, def, levelDef)
    : calculatePhysicalDamage(heroStats, targetStats, def, levelDef);
  const lsEmpower = heroStats?.lsEmpower ?? 0;
  const lsBackbiting = heroStats?.lsBackbiting ?? 0;
  if (lsEmpower > 0) damage = Math.round(damage * (1 + lsEmpower / 100));
  if (isPhysical && lsBackbiting > 0) damage = Math.round(damage * (1 + lsBackbiting / 100));
  
  // Застосовуємо множник від shot
  const damageWithShot = Math.round(damage * shotResult.multiplier);
  
  const isCrit = isAttack && Math.random() * 100 < critChance;
  const totalDamage = isCrit ? Math.round(damageWithShot * critMult) : damageWithShot;

  if (totalDamage > 0) {
    addDailyProgress("daily_damage", totalDamage);
  }

  // Обробляємо спеціальні ефекти скілу (stun, hold, sleep тощо)
  const skillEffects = processSkillEffects(def, levelDef, {
    stunChanceBonus: heroStats?.stunChanceBonus,
  });
  let mobStunnedUntil = state.mobStunnedUntil;
  if (skillEffects.stun?.applied) {
    mobStunnedUntil = now + skillEffects.stun.duration;
  }

  const nextMobHP = Math.max(0, state.mobHP - totalDamage);
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const currentHeroHP = Math.min(maxHp, hero.hp ?? maxHp);
  const currentHeroMP = Math.min(maxMp, hero.mp ?? maxMp);
  const currentHeroCP = Math.min(maxCp, hero.cp ?? maxCp);

  const lsRskFocus = heroStats?.lsRskFocus ?? 0;
  const mpActuallySpent = (lsRskFocus > 0 && Math.random() * 100 < lsRskFocus) ? 0 : mpCost;
  const nextHeroMP = currentHeroMP - mpActuallySpent;
  
  const skillCritical = checkSkillCritical(heroStats, activeBuffs);
  const lsRskHaste = heroStats?.lsRskHaste ?? 0;
  const rskHasteProc = lsRskHaste > 0 && Math.random() * 100 < lsRskHaste;
  const cooldownDuration = (skillCritical || rskHasteProc) ? 0 : cooldownMs(def.cooldown, false);
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
      ? (isMagic
          ? `Магічний критичний удар! Ви наносите ${Math.round(totalDamage)}.`
          : `Критический удар! Вы наносите ${Math.round(totalDamage)}.`)
      : `Вы наносите ${Math.round(totalDamage)}.`,
    skillEffects.stun?.applied 
      ? `${state.mob?.name} оглушен на ${skillEffects.stun.duration / 1000} секунд!`
      : skillEffects.stun && !skillEffects.stun.applied
      ? `${state.mob?.name} устоял против оглушения.`
      : null,
    ...state.log,
  ].filter((msg) => msg !== null).slice(0, 30);

  if (nextMobHP <= 0) {
    if (!state.mob) return false;
    const v = commitMobVictoryToHeroStore({
      mob: state.mob,
      heroBuffs: updatedBuffs,
      postVictoryHp: healedHeroHP,
      postVictoryMp: nextHeroMP,
      postVictoryCp: currentHeroCP,
      useBuffedBattleStats: true,
      zoneId: state.zoneId,
      mobIndex: state.mobIndex,
    });
    const { displayExp, displaySp, displayAdena, dropMessages, mobSpoiled, levelUpMessage, partyMemberLootLines } =
      v;
    if (levelUpMessage) newLog.unshift(levelUpMessage);

    setAndPersist({
      mobHP: 0,
      status: "victory",
      mobStunnedUntil: undefined, // Скидаємо stun при смерті моба
      log: [
        `${state.mob?.name} повержен.`,
        mobSpoiled ? `Auto Spoil: моб автоматически спойлен.` : null,
        ...buildVictoryResourceLogLines(
          hero.name ?? "Герой",
          displayExp,
          displaySp,
          displayAdena
        ),
        ...(dropMessages.length > 0 ? dropMessages : []),
        ...(partyMemberLootLines.length > 0 ? partyMemberLootLines : []),
        ...newLog,
      ].filter((msg) => msg !== null).slice(0, 30),
      cooldowns: updatedCooldowns,
      lastReward: {
        exp: displayExp,
        sp: displaySp,
        adena: displayAdena,
        mob: state.mob?.name ?? "",
        spoiled: mobSpoiled,
        mobAggressivePatrol: state.mob?.aggressivePatrol === true,
      },
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

