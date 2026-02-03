import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";
import { recalculateAllStats } from "../../../../utils/stats/recalculateAllStats";
import { hasSpiritshotActive } from "./shotHelpers";

export function handleHealSkill(
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
  get: () => BattleState
): boolean {
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  
  if (def.id === 1271) {
    // ❗ Читаємо HP з hero.resources
    const currentHpCheck = Math.min(maxHp, hero.hp ?? maxHp);
    if (currentHpCheck > maxHp * 0.25) {
      setAndPersist({
        heroBuffs: activeBuffs,
        log: [`${def.name}: можно использовать при HP ниже 25%`, ...state.log].slice(0, 30),
      });
      return true;
    }
  }
  
  const basePower = typeof levelDef.power === "number" ? levelDef.power : 0;
  const healBonus = heroStats?.healPower ?? 0;
  const healAmountRaw =
    def.powerType === "percent" ? Math.round(maxHp * (basePower / 100)) : basePower;
  let healAmount = Math.round(healAmountRaw * (1 + Math.max(0, healBonus) / 100));
  
  // Якщо spiritshot увімкнений на панелі - збільшуємо хіл в 2 рази
  const spiritshotActive = hasSpiritshotActive(hero, state.loadoutSlots ?? [], state.activeChargeSlots ?? []);
  if (spiritshotActive) {
    healAmount = Math.round(healAmount * 2);
  }
  
  // Діагностика для хіл скілів
  if (def.id === 1217 || def.id === 1219) {
    console.log(`[HEAL] ${def.name} Lv ${levelDef.level}:`, {
      basePower,
      healBonus,
      healAmountRaw,
      healAmount,
      skillId: def.id,
      level: levelDef.level,
    });
  }
  
  // ❗ Читаємо поточні ресурси з hero.resources (єдине джерело правди)
  const currentHeroHP = Math.min(maxHp, hero.hp ?? maxHp);
  const currentHeroMP = Math.min(maxMp, hero.mp ?? maxMp);
  const currentHeroCP = Math.min(maxCp, hero.cp ?? maxCp);

  // special-case: summon heal / recharge (legacy check, now handled by specialSkills.ts)
  if (def.id === 1127 || def.id === 1126) {
    if (!state.summon) {
      setAndPersist({
        heroBuffs: activeBuffs,
        log: [`${def.name}: нет призванного существа`, ...state.log].slice(0, 30),
      });
      return true;
    }
    const nextCD = now + cooldownMs(def.cooldown, false);
    const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
    const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
    const nextHeroMP = currentHeroMP - mpCost;
    const isMpHeal = def.id === 1126;
    const healedSummonHp = isMpHeal
      ? state.summon.hp
      : Math.min(state.summon.maxHp, state.summon.hp + healAmount);
    const healedSummonMp = isMpHeal
      ? Math.min(state.summon.maxMp, state.summon.mp + healAmount)
      : state.summon.mp;
    const updatedSummon = { ...state.summon, hp: healedSummonHp, mp: healedSummonMp };
    const newLog = [
      isMpHeal
        ? `${def.name}: +${healAmount} MP призванному существу`
        : `${def.name}: +${healAmount} HP призванному существу`,
      ...state.log,
    ].slice(0, 30);

    // ❗ Хіл НІКОЛИ не міняє maxHp - тільки mp
    updateHero({ mp: nextHeroMP });
    
    setAndPersist({
      status: state.status,
      log: newLog,
      cooldowns: updatedCooldowns,
      heroBuffs: activeBuffs,
      summon: updatedSummon,
    });
    return true;
  }

  // ❗ Хіл НІКОЛИ не міняє maxHp - тільки hp
  // maxHp з бафів використовуємо тільки для cap, але НЕ передаємо в updateHero
  const nextHeroHP = Math.min(maxHp, currentHeroHP + healAmount);
  const nextHeroMP = currentHeroMP - mpCost;
  
  // Перераховуємо стати після зміни HP через heal, щоб активувати/деактивувати пасивні скіли з hpThreshold
  const heroWithHealedHp = { ...hero, hp: nextHeroHP, maxHp: maxHp };
  const recalculated = recalculateAllStats(heroWithHealedHp, activeBuffs);
  
  // Оновлюємо battleStats якщо вони змінилися
  if (recalculated.baseFinalStats.pAtk !== hero.battleStats?.pAtk ||
      recalculated.baseFinalStats.mAtk !== hero.battleStats?.mAtk ||
      recalculated.baseFinalStats.pDef !== hero.battleStats?.pDef ||
      recalculated.baseFinalStats.mDef !== hero.battleStats?.mDef) {
    updateHero({ 
      hp: nextHeroHP, 
      mp: nextHeroMP, 
      cp: currentHeroCP,
      battleStats: recalculated.baseFinalStats 
    });
  } else {
    updateHero({ 
      hp: nextHeroHP, 
      mp: nextHeroMP, 
      cp: currentHeroCP,
    });
  }
  
  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
  const newLog = [`Вы использовали ${def.name} (+${healAmount} HP)`, ...state.log].slice(0, 30);

  setAndPersist({
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: activeBuffs,
  });
  return true;
}

