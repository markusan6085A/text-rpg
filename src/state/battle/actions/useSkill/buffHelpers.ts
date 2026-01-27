import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";
import {
  SONIC_FOCUS_ID,
  SONIC_CONSUMERS,
  SONIC_COST,
  MAX_FOCUS_STACKS,
  FOCUS_DURATION_MS,
  FOCUSED_FORCE_ID,
  FOCUSED_FORCE_CONSUMERS,
  FOCUSED_FORCE_COST,
  MAX_FOCUSED_FORCE_STACKS,
  FOCUSED_FORCE_DURATION_MS,
} from "./helpers";

/**
 * Створює hero об'єкт для applySkillEffect
 */
export function createHeroAsSkillHero(hero: Hero, heroStats: any) {
  return {
    pAtk: heroStats?.pAtk ?? 0,
    pDef: heroStats?.pDef ?? 0,
    mAtk: heroStats?.mAtk ?? 0,
    mDef: heroStats?.mDef ?? 0,
    maxHp: hero.maxHp ?? 1,
    maxMp: hero.maxMp ?? 1,
    critRate: heroStats?.crit ?? 0,
    hp: hero.hp ?? 0,
    mp: hero.mp ?? 0,
    cp: hero.cp ?? 0,
    ...heroStats,
  };
}

/**
 * Створює mob об'єкт для applySkillEffect
 */
export function createMobAsSkillHero(state: BattleState) {
  if (!state.mob) return null;
  
  return {
    pAtk: state.mob.pAtk ?? (state.mob.level ?? 1) * 20,
    pDef: state.mob.pDef ?? Math.round((state.mob.level ?? 1) * 8 + state.mob.hp * 0.15),
    mAtk: state.mob.mAtk ?? 0,
    mDef: state.mob.mDef ?? Math.round((state.mob.level ?? 1) * 8 + state.mob.hp * 0.12),
    maxHp: state.mob.hp,
    maxMp: state.mob.mp ?? 0,
    critRate: 0,
    hp: state.mobHP,
    mp: (state.mob as any).mp ?? 100,
    cp: (state.mob as any).cp ?? 0,
  };
}

/**
 * Обробляє ефекти скілу та створює список ефектів для бафу
 */
export function processSkillEffects(
  def: SkillDefinition,
  levelDef: SkillLevelDefinition
): any[] {
  const effects = Array.isArray(def.effects) ? def.effects : [];
  
  const effList =
    effects.length > 0
      ? effects.map((eff: any) => {
          // Діагностика для Rapid Shot (id 99)
          if (def.id === 99 && import.meta.env.DEV) {
            console.log(`[processSkillEffects] Rapid Shot BEFORE processing:`, {
              eff,
              effMode: eff.mode,
              effModeType: typeof eff.mode,
              defPowerType: def.powerType,
              levelDefPower: levelDef.power,
            });
          }
          
          // Спрощена логіка: використовуємо eff.mode, якщо встановлено, інакше fallback на powerType або "flat"
          const mode = eff.mode ?? (def.powerType === "multiplier" ? "multiplier" : def.powerType === "percent" ? "percent" : "flat");
          
          // Діагностика для Rapid Shot
          if (def.id === 99 && import.meta.env.DEV) {
            console.log(`[processSkillEffects] Rapid Shot mode calculated:`, {
              effMode: eff.mode,
              defPowerType: def.powerType,
              calculatedMode: mode,
            });
          }
          
          // Для multiplier режиму обчислюємо multiplier з power
          if (mode === "multiplier") {
            let multiplier: number;
            if (eff.multiplier !== undefined) {
              // Якщо multiplier встановлено явно в effects
              multiplier = eff.multiplier;
            } else if (levelDef.power !== undefined && !isNaN(levelDef.power)) {
              // Якщо power >= 1, використовуємо як готовий множник (1.12 = 12% збільшення)
              // Інакше інтерпретуємо як відсоток (8 = 8% збільшення → 1.08)
              multiplier = levelDef.power >= 1 ? levelDef.power : 1 + levelDef.power / 100;
            } else {
              multiplier = 1; // Fallback - немає зміни
            }
            
            const result = {
              ...eff,
              multiplier,
              mode: "multiplier",
            };
            
            // Діагностика для Rapid Shot
            if (def.id === 99 && import.meta.env.DEV) {
              console.log(`[processSkillEffects] Rapid Shot MULTIPLIER result:`, {
                result,
                resultMode: result.mode,
                resultMultiplier: result.multiplier,
                originalEff: eff,
              });
            }
            
            return result;
          }
          
          // Для percent та flat режимів обчислюємо value
          const base = typeof eff.value === "number" 
            ? eff.value 
            : typeof levelDef.power === "number" 
            ? levelDef.power 
            : 0;
          
          // Для debuff скілів з mode "percent" значення має бути від'ємним
          const finalValue = def.category === "debuff" && mode === "percent"
            ? -Math.abs(base * (eff.multiplier ?? 1))
            : base * (eff.multiplier ?? 1);
          
          const result = {
            ...eff,
            value: finalValue,
            mode,
          };
          
          // Діагностика для Rapid Shot (якщо не multiplier)
          if (def.id === 99 && import.meta.env.DEV) {
            console.warn(`[processSkillEffects] Rapid Shot NOT multiplier!`, {
              result,
              resultMode: result.mode,
              calculatedMode: mode,
              effMode: eff.mode,
            });
          }
          
          return result;
        })
      : typeof levelDef.power === "number"
      ? [{ stat: "pAtk", mode: def.powerType === "percent" ? "percent" : "flat", value: levelDef.power }]
      : [];

  return effList;
}

/**
 * Порівнює рівень бафів - чи новий баф кращий за старий
 * Повертає true якщо новий баф має більші ефекти (кращий рівень)
 */
export function isBuffBetter(newBuff: any, oldBuff: any): boolean {
  // Якщо бафи мають різні id - не порівнюємо
  if (newBuff.id !== oldBuff.id) return false;
  
  // Порівнюємо загальну силу ефектів
  const newTotalPower = (newBuff.effects || []).reduce((sum: number, eff: any) => {
    if (eff.mode === "multiplier") {
      return sum + (eff.multiplier || 1);
    } else if (eff.mode === "percent") {
      return sum + Math.abs(eff.value || 0);
    } else {
      return sum + Math.abs(eff.value || 0);
    }
  }, 0);
  
  const oldTotalPower = (oldBuff.effects || []).reduce((sum: number, eff: any) => {
    if (eff.mode === "multiplier") {
      return sum + (eff.multiplier || 1);
    } else if (eff.mode === "percent") {
      return sum + Math.abs(eff.value || 0);
    } else {
      return sum + Math.abs(eff.value || 0);
    }
  }, 0);
  
  // Новий баф кращий якщо має більшу загальну силу
  return newTotalPower > oldTotalPower;
}

/**
 * Перевіряє, чи два бафи однакові (для заміни)
 */
export function createIsSameBuff(def: SkillDefinition) {
  const isWarcryerBuff = def.code && def.code.startsWith("WC_") && def.buffGroup;
  
  return (b: any) => {
    if (isWarcryerBuff && def.buffGroup) {
      // Для WC-бафів: замінюємо бафи з тієї ж групи
      return b.buffGroup === def.buffGroup && b.buffGroup?.startsWith("WC_");
    }
    // Стандартна логіка для інших бафів
    return b.id === def.id || b.name === def.name || (def.stackType && b.stackType === def.stackType);
  };
}

/**
 * Обробляє WC-бафи (Warcryer buffs) - обмеження кількості та заміна найстаріших
 */
export function processWarcryerBuffs(
  newBuffs: any[],
  def: SkillDefinition,
  heroLevel: number
): any[] {
  const isWarcryerBuff = def.code && def.code.startsWith("WC_") && def.buffGroup;
  
  if (!isWarcryerBuff || !def.buffGroup) {
    return newBuffs;
  }
  
  const maxWcBuffs = heroLevel >= 76 ? 4 : 3;
  
  // Підраховуємо всі WC-бафи (включаючи новий)
  const allWcBuffs = newBuffs.filter((b: any) => 
    b.buffGroup && b.buffGroup.startsWith("WC_")
  );
  
  // Якщо перевищено ліміт, видаляємо найстаріший WC-баф (окрім нового)
  if (allWcBuffs.length > maxWcBuffs) {
    // Сортуємо за startedAt (найстаріший перший), але новий баф завжди залишається
    const newBuffId = def.id;
    const oldWcBuffs = allWcBuffs.filter((b: any) => b.id !== newBuffId);
    const sortedOldWcBuffs = [...oldWcBuffs].sort((a: any, b: any) => 
      (a.startedAt ?? 0) - (b.startedAt ?? 0)
    );
    
    // Видаляємо найстаріші бафи, поки не досягнемо ліміту
    const toRemove = sortedOldWcBuffs.slice(0, allWcBuffs.length - maxWcBuffs);
    const toRemoveIds = new Set(toRemove.map((b: any) => b.id));
    
    const filtered = newBuffs.filter((b: any) => 
      !(b.buffGroup && b.buffGroup.startsWith("WC_") && toRemoveIds.has(b.id))
    );
    
    if (import.meta.env.DEV) {
      console.log(`[WC BUFF LIMIT] Removed ${toRemove.length} oldest WC buffs:`, {
        removed: toRemove.map((b: any) => b.name),
        remaining: filtered.filter((b: any) => b.buffGroup?.startsWith("WC_")).map((b: any) => b.name),
        maxWcBuffs,
        heroLevel,
        newBuff: def.name,
      });
    }
    
    return filtered;
  }
  
  return newBuffs;
}

/**
 * Обробляє Sonic Focus та Focused Force стеки
 */
export function processStackingBuffs(
  newBuffs: any[],
  def: SkillDefinition,
  effList: any[],
  now: number,
  activeBuffs: any[]
): any[] {
  if (def.id === SONIC_FOCUS_ID) {
    const prev = activeBuffs.find((b) => b.id === SONIC_FOCUS_ID);
    const nextStacks = Math.min(MAX_FOCUS_STACKS, (prev?.stacks ?? 0) + 1);
    const filteredBase = newBuffs.filter((b) => b.id !== SONIC_FOCUS_ID);
    
    return [
      {
        id: def.id,
        name: def.name,
        icon: def.icon || "/skills/attack.jpg",
        stackType: def.stackType,
        effects: effList,
        expiresAt: now + FOCUS_DURATION_MS,
        startedAt: now,
        durationMs: FOCUS_DURATION_MS,
        stacks: nextStacks,
      },
      ...filteredBase,
    ];
  }
  
  if (def.id === FOCUSED_FORCE_ID) {
    const prev = activeBuffs.find((b) => b.id === FOCUSED_FORCE_ID);
    const nextStacks = Math.min(MAX_FOCUSED_FORCE_STACKS, (prev?.stacks ?? 0) + 1);
    const filteredBase = newBuffs.filter((b) => b.id !== FOCUSED_FORCE_ID);
    
    return [
      {
        id: def.id,
        name: def.name,
        icon: def.icon || "/skills/attack.jpg",
        stackType: def.stackType,
        effects: effList,
        expiresAt: now + FOCUSED_FORCE_DURATION_MS,
        startedAt: now,
        durationMs: FOCUSED_FORCE_DURATION_MS,
        stacks: nextStacks,
      },
      ...filteredBase,
    ];
  }
  
  return newBuffs;
}

/**
 * Обробляє витрату Sonic Focus стеків для спеціальних скілів
 */
export function consumeSonicFocus(newBuffs: any[], def: SkillDefinition): any[] {
  if (!SONIC_CONSUMERS.has(def.id)) {
    return newBuffs;
  }
  
  const need = SONIC_COST[def.id] ?? 1;
  const focusBuff = newBuffs.find((b) => b.id === SONIC_FOCUS_ID);
  const stacks = focusBuff?.stacks ?? 0;
  const newStacks = Math.max(0, stacks - need);
  const withoutFocus = newBuffs.filter((b) => b.id !== SONIC_FOCUS_ID);
  const updatedFocus = newStacks > 0 ? { ...focusBuff, stacks: newStacks } : null;
  
  return updatedFocus ? [updatedFocus, ...withoutFocus] : withoutFocus;
}

