import { applySkillEffect } from "../../../../data/skills/applySkillEffect";
import { persistSnapshot } from "../../helpers";
import { persistBattle } from "../../persist";
import { SUMMON_SKILLS, checkSkillCritical, SONIC_FOCUS_ID, FOCUSED_FORCE_ID } from "./helpers";
import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";
import type { Setter } from "./helpers";
import { recalculateAllStats } from "../../../../utils/stats/recalculateAllStats";
import {
  createHeroAsSkillHero,
  createMobAsSkillHero,
  processSkillEffects,
  createIsSameBuff,
  processWarcryerBuffs,
  processStackingBuffs,
  consumeSonicFocus,
  isBuffBetter,
} from "./buffHelpers";
import { handleToggleOff, createToggleBuff } from "./toggleSkill";
import { handleSummonBuffs } from "./summonBuffs";
import { handleWarriorBane, handleMageBane, handleDebuffSkill } from "./debuffHandlers";
import { handleBattleRoar, handleBodyToMind, handleOtherSpecialSkill } from "./specialSkillHandlers";
import { hasSpiritshotActive } from "./shotHelpers";

export function handleBuffSkill(
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
  updateHero: (partial: Partial<Hero>) => void,
  setAndPersist: (updates: Partial<BattleState>) => void,
  set: Setter,
  get: () => BattleState
): boolean {
  // Перевірка на блокування бафів
  if (state.heroBuffsBlockedUntil && state.heroBuffsBlockedUntil > now) {
    const remainingBlockTime = Math.ceil((state.heroBuffsBlockedUntil - now) / 1000);
    setAndPersist({
      log: [`Ваши бафы заблокированы (осталось ${remainingBlockTime} сек).`, ...state.log].slice(0, 30),
    });
    return true;
  }

  // Діагностика для toggle скілів
  if (def.toggle === true && import.meta.env.DEV) {
    console.log(`[TOGGLE] handleBuffSkill called for ${def.name} (${def.id}):`, {
      skillId,
      category: def.category,
      toggle: def.toggle,
      cooldown: def.cooldown,
      duration: def.duration,
      level: levelDef.level,
      power: levelDef.power,
      effects: def.effects,
    });
  }

  // Summon skills (legacy handler, now handled by specialSkills.ts)
  if (SUMMON_SKILLS.has(def.id)) {
    const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
    // ❗ Читаємо поточні ресурси з hero.resources
    const curHeroHP = Math.min(maxHp, hero.hp ?? maxHp);
    const curHeroMP = Math.min(maxMp, hero.mp ?? maxMp);
    const curHeroCP = Math.min(maxCp, hero.cp ?? maxCp);

    const nextHeroMP = curHeroMP - mpCost;
    const summonMaxHp = Math.max(1, Math.round(maxHp * 0.7));
    const summonMaxMp = Math.max(1, Math.round(maxMp * 0.7));
    const summonPAtk = Math.round((heroStats?.pAtk ?? 0) * 0.65);
    const summonPDef = Math.round((heroStats?.pDef ?? 0) * 0.65);
    const summonMAtk = Math.round((heroStats?.mAtk ?? 0) * 0.65);
    const summonMDef = Math.round((heroStats?.mDef ?? 0) * 0.65);
    const nextCD = now + cooldownMs(def.cooldown, false);
    const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
    const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
    const newSummon = {
      id: def.id,
      name: def.name,
      icon: def.icon,
      level: hero?.level ?? 1,
      hp: summonMaxHp,
      mp: summonMaxMp,
      maxHp: summonMaxHp,
      maxMp: summonMaxMp,
      pAtk: summonPAtk,
      pDef: summonPDef,
      mAtk: summonMAtk,
      mDef: summonMDef,
    };

    // ❗ Оновлюємо ресурси в hero.resources (НЕ передаємо maxHp/maxMp/maxCp)
    updateHero({ 
      mp: nextHeroMP, 
      cp: curHeroCP,
    });
    
    const newLog = [`Вы призвали ${def.name}`, ...state.log].slice(0, 30);
    const updates: Partial<BattleState> = {
      status: state.status,
      log: newLog,
      cooldowns: updatedCooldowns,
      heroBuffs: activeBuffs,
      summon: newSummon,
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
    return true;
  }

  // Використовуємо applySkillEffect для правильного застосування ефектів
  const heroAsSkillHero = createHeroAsSkillHero(hero, heroStats);
  const mobAsSkillHero = createMobAsSkillHero(state);

  const targets = def.category === "debuff" && mobAsSkillHero ? [mobAsSkillHero] : [heroAsSkillHero];
  const skillResult = applySkillEffect(heroAsSkillHero, targets, def, levelDef);

  // Обробляємо ефекти скілу
  const effList = processSkillEffects(def, levelDef);
  
  // Діагностика для Rapid Shot (id 99)
  if (def.id === 99 && import.meta.env.DEV) {
    console.log(`[handleBuffSkill] Rapid Shot effList after processSkillEffects:`, {
      effList,
      effListDetails: effList.map((e: any) => ({
        stat: e.stat,
        mode: e.mode,
        multiplier: e.multiplier,
        value: e.value,
      })),
      defEffects: def.effects,
      levelDefPower: levelDef.power,
      defPowerType: def.powerType,
    });
  }

  // category=buff завжди НЕ toggle — навіть якщо toggle=true в даних
  const isToggle = def.category === "buff" ? false : (def.toggle === true);
  
  // 🔍 Діагностика: перевірка чи є buff з toggle:true в даних
  if (import.meta.env.DEV && def.category === "buff" && def.toggle === true) {
    console.warn("[BUG] Buff skill has toggle:true", { id: def.id, name: def.name, code: def.code, profession: hero.profession });
  }
  
  const isSameBuff = createIsSameBuff(def);
  // Для toggle скілів duration не використовується - вони вимикаються тільки вручну
  const durationSec = isToggle ? 0 : (def.duration ?? 10);
  
  // Перевірка Skill Critical (Focus Skill Mastery)
  const skillCritical = !isToggle && checkSkillCritical(heroStats, activeBuffs);
  // Toggle скіли мають простий cooldown (зазвичай 1 секунда) без урахування castSpeed
  const baseCooldownMs = isToggle 
    ? (def.cooldown ?? 1) * 1000  // Для toggle - просто секунди в мілісекунди
    : (skillCritical ? 0 : cooldownMs(def.cooldown ?? 5, false));
  const nextCD = now + baseCooldownMs;
  
  // Діагностика для toggle скілів
  if (isToggle && import.meta.env.DEV) {
    console.log(`[TOGGLE] Cooldown calculation for ${def.name} (${def.id}):`, {
      defCooldown: def.cooldown,
      baseCooldownMs,
      nextCD,
      now,
    });
  }
  
  // Якщо Skill Critical спрацював, подвоюємо тривалість бафу
  // Для toggle скілів finalDurationSec завжди 0
  const finalDurationSec = isToggle ? 0 : (skillCritical ? durationSec * 2 : durationSec);

  // Обробка toggle скілів - перевірка чи вже активний
  if (isToggle) {
    const toggledOff = handleToggleOff(
      def,
      activeBuffs,
      state,
      hero,
      computeMaxNow,
      updateHero,
      setAndPersist,
      get
    );
    if (toggledOff) {
      return true; // Toggle вимкнено
    }
  }

  const { maxHp: curMaxHp, maxMp: curMaxMp, maxCp: curMaxCp } = computeMaxNow(activeBuffs);
  // ❗ Читаємо поточні ресурси з hero.resources
  const curHeroHP = Math.min(curMaxHp, hero.hp ?? curMaxHp);
  const curHeroMP = Math.min(curMaxMp, hero.mp ?? curMaxMp);
  const curHeroCP = Math.min(curMaxCp, hero.cp ?? curMaxCp);

  const nextHeroMP = curHeroMP - mpCost;
  // Видаляємо бафи з таким самим stackType
  const filteredBase = activeBuffs.filter((b) => !isSameBuff(b));

  let newBuffs: any[] = filteredBase;

  // Обробка стекування бафів (Sonic Focus, Focused Force)
  newBuffs = processStackingBuffs(newBuffs, def, effList, now, activeBuffs);

  // Додаємо новий баф, якщо є ефекти
  if (effList.length > 0 && def.id !== SONIC_FOCUS_ID && def.id !== FOCUSED_FORCE_ID) {
    const newBuff = createToggleBuff(def, effList, now, finalDurationSec, isToggle);
    
    // 🔥 КРИТИЧНО: Перевіряємо чи є вже такий самий баф, але кращого рівня
    // Якщо є старий баф з таким самим id, але новий кращий - замінюємо
    // Якщо старий кращий - не додаємо новий
    const existingBuff = activeBuffs.find((b) => b.id === def.id);
    if (existingBuff) {
      if (isBuffBetter(newBuff, existingBuff)) {
        // Новий баф кращий - додаємо (старий вже видалений через filteredBase)
        newBuffs = [...newBuffs, newBuff];
        if (import.meta.env.DEV) {
          console.log(`[BUFF REPLACEMENT] Replacing ${def.name} with better version`);
        }
      } else {
        // Старий баф кращий - не додаємо новий
        if (import.meta.env.DEV) {
          console.log(`[BUFF REPLACEMENT] Keeping existing ${def.name} (better than new)`);
        }
      }
    } else {
      // Немає такого бафу - додаємо новий
      newBuffs = [...newBuffs, newBuff];
    }
  }

  // Обробка WC-бафів (обмеження кількості)
  newBuffs = processWarcryerBuffs(newBuffs, def, hero.level ?? 1);

  // Обробка Warrior Bane та Mage Bane
  const warriorBaneResult = handleWarriorBane(def, newBuffs);
  newBuffs = warriorBaneResult.newBuffs;
  const warriorBaneLog = warriorBaneResult.log;

  const mageBaneResult = handleMageBane(def, newBuffs);
  newBuffs = mageBaneResult.newBuffs;
  const mageBaneLog = mageBaneResult.log;

  // Обробка debuff скілів
  const debuffResult = handleDebuffSkill(def, levelDef, state, effList, now);
  let newMobBuffs = debuffResult.newMobBuffs;
  let mobStunnedUntil = debuffResult.mobStunnedUntil;
  const debuffLog = debuffResult.log;

  // Обробка special скілів
  const battleRoarResult = handleBattleRoar(def, levelDef, curMaxHp);
  const bodyToMindResult = handleBodyToMind(def, levelDef, curHeroHP);
  const otherSpecialLog = handleOtherSpecialSkill(def);

  // Перевірка Body To Mind - чи можна використати
  if (def.id === 1157 && !bodyToMindResult.canCast) {
    setAndPersist({
      heroBuffs: activeBuffs,
      log: [bodyToMindResult.log, ...state.log].slice(0, 30),
    });
    return true;
  }

  // Якщо баф без ефектів і нічого не застосовано (ні баф, ні debuff, ні special) — не ставимо відкат і не списуємо MP
  const hasDebuffOrStun = (debuffResult.newMobBuffs?.length ?? 0) > 0 || debuffResult.mobStunnedUntil != null;
  const hasSpecialEffect = (battleRoarResult.hpChange !== 0 || bodyToMindResult.hpChange !== 0 || bodyToMindResult.mpChange !== 0);
  const buffWasAdded = newBuffs.some((b) => b.id === def.id);
  if (
    def.category === "buff" &&
    effList.length === 0 &&
    !buffWasAdded &&
    !hasDebuffOrStun &&
    !hasSpecialEffect
  ) {
    setAndPersist({
      log: [`${def.name}: немає ефекту (навик не застосовано).`, ...state.log].slice(0, 30),
    });
    return true;
  }

  const specialHpChange = battleRoarResult.hpChange + bodyToMindResult.hpChange;
  const specialMpChange = bodyToMindResult.mpChange;
  const specialLog = battleRoarResult.log || bodyToMindResult.log || otherSpecialLog;

  // Витрата Sonic Focus стеків
  newBuffs = consumeSonicFocus(newBuffs, def);

  const logMessages = [
    warriorBaneLog || mageBaneLog || debuffLog || specialLog || `Вы использовали ${def.name}`,
    ...(skillResult && skillResult.tick ? [`${def.name} будет действовать каждые ${skillResult.tick.interval} сек.`] : []),
  ].filter(Boolean);

  const newLog = [...logMessages, ...state.log].slice(0, 30);
  const { maxHp, maxMp, maxCp } = computeMaxNow(newBuffs);
  let healedFromMax = Math.max(0, maxHp - curMaxHp);
  
  const clamp = (v: number, m: number) => Math.min(m, Math.max(0, v));
  const rh = def.resourceHeal;
  const addHp = (rh?.hp ?? 0) + (rh?.hpPct ? Math.round(maxHp * rh.hpPct) : 0);
  const addMp = (rh?.mp ?? 0) + (rh?.mpPct ? Math.round(maxMp * rh.mpPct) : 0);
  const addCp = (rh?.cp ?? 0) + (rh?.cpPct ? Math.round(maxCp * rh.cpPct) : 0);
  
  // Якщо spiritshot увімкнений на панелі - збільшуємо відновлення HP від бафа в 2 рази
  const spiritshotActive = hasSpiritshotActive(hero, state.loadoutSlots ?? [], state.activeChargeSlots ?? []);
  if (spiritshotActive && healedFromMax > 0) {
    healedFromMax = Math.round(healedFromMax * 2);
  }
  
  // Toggle скіли мають cooldown (зазвичай 1 секунда) після вмикання/вимикання
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: nextCD };
  
  // Діагностика для toggle скілів - перевірка cooldown перед збереженням
  if (isToggle && import.meta.env.DEV) {
    console.log(`[TOGGLE] Setting cooldown for ${def.name} (${def.id}):`, {
      skillId,
      nextCD,
      cooldownSeconds: (nextCD - now) / 1000,
      updatedCooldowns: updatedCooldowns[skillId],
    });
  }
  
  // ❗ Оновлюємо ресурси в hero.resources з урахуванням special ефектів та resourceHeal
  const newHeroHP = clamp(curHeroHP + healedFromMax + specialHpChange + addHp, maxHp);
  const newHeroMP = clamp(nextHeroMP + specialMpChange + addMp, maxMp);
  const newHeroCP = clamp(curHeroCP + addCp, maxCp);
  
  // Перераховуємо стати після зміни HP через бафи
  const heroWithNewHp = { ...hero, hp: newHeroHP, maxHp: maxHp };
  const recalculated = recalculateAllStats(heroWithNewHp, newBuffs);
  
  // Оновлюємо battleStats якщо вони змінилися
  if (recalculated.baseFinalStats.pAtk !== hero.battleStats?.pAtk ||
      recalculated.baseFinalStats.mAtk !== hero.battleStats?.mAtk ||
      recalculated.baseFinalStats.pDef !== hero.battleStats?.pDef ||
      recalculated.baseFinalStats.mDef !== hero.battleStats?.mDef) {
    updateHero({ 
      hp: newHeroHP, 
      mp: newHeroMP, 
      cp: newHeroCP,
      battleStats: recalculated.baseFinalStats 
    });
  } else {
    updateHero({ 
      hp: newHeroHP, 
      mp: newHeroMP, 
      cp: newHeroCP,
    });
  }
  
  // Обробка бафів для сумонів
  const summonBuffsResult = handleSummonBuffs(def, state, effList, now, finalDurationSec);
  const newSummonBuffs = summonBuffsResult.newSummonBuffs;

  const merged: Partial<BattleState> = {
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: newBuffs,
    mobBuffs: newMobBuffs,
    summonBuffs: newSummonBuffs,
    mobStunnedUntil: mobStunnedUntil,
  };
  
  // Діагностика для toggle скілів - перевірка бафу перед збереженням
  if (isToggle && import.meta.env.DEV) {
    const toggleBuff = newBuffs.find((b) => b.id === def.id);
    console.log(`[TOGGLE] Saving buff for ${def.name} (${def.id}):`, {
      toggleBuff: toggleBuff ? {
        id: toggleBuff.id,
        name: toggleBuff.name,
        expiresAt: toggleBuff.expiresAt,
        isMaxSafe: toggleBuff.expiresAt === Number.MAX_SAFE_INTEGER,
      } : null,
      cooldownInState: merged.cooldowns?.[skillId],
      cooldownSeconds: merged.cooldowns?.[skillId] ? (merged.cooldowns[skillId] - now) / 1000 : null,
    });
  }
  
  set((prev) => ({ ...(prev as any), ...(merged as any) }));
  persistSnapshot(get, persistBattle, merged);
  return true;
}
