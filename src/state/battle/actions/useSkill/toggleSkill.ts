import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import type { SkillDefinition } from "../../../../data/skills/types";
import type { Setter } from "./helpers";
import { createIsSameBuff } from "./buffHelpers";

/**
 * Перевіряє, чи toggle скіл вже активний, і якщо так - вимикає його
 */
export function handleToggleOff(
  def: SkillDefinition,
  activeBuffs: any[],
  state: BattleState,
  hero: Hero,
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  updateHero: (partial: Partial<Hero>) => void,
  setAndPersist: (updates: Partial<BattleState>) => void,
  get: () => BattleState
): boolean {
  const isToggle = def.toggle === true;
  if (!isToggle) {
    return false;
  }
  
  const isSameBuff = createIsSameBuff(def);
  const alreadyActive = activeBuffs.some(isSameBuff);
  
  if (import.meta.env.DEV) {
    console.log(`[TOGGLE] ${def.name} (${def.id}) - Check active:`, {
      alreadyActive,
      activeBuffsCount: activeBuffs.length,
    });
  }
  
  if (!alreadyActive) {
    return false; // Toggle не активний, продовжуємо з додаванням
  }
  
  // Toggle активний - вимикаємо його
  const filtered = activeBuffs.filter((b) => !isSameBuff(b));
  const { maxHp, maxMp, maxCp } = computeMaxNow(filtered);
  
  // ❗ Оновлюємо ресурси в hero.resources (обмежуємо hp до нового maxHp з бафів, але НЕ передаємо maxHp)
  const curHP = Math.min(maxHp, hero.hp ?? maxHp);
  const curMP = Math.min(maxMp, hero.mp ?? maxMp);
  const curCP = Math.min(maxCp, hero.cp ?? maxCp);
  updateHero({ hp: curHP, mp: curMP, cp: curCP });
  
  // Toggle скіли мають cooldown (зазвичай 1 секунда) після вимикання
  const cooldownSec = def.cooldown ?? 1;
  const cooldownMs = cooldownSec * 1000;
  const nextCD = Date.now() + cooldownMs;
  const updatedCooldowns = { ...(get().cooldowns || {}), [def.id]: nextCD };
  
  setAndPersist({
    status: state.status,
    log: [`${def.name} отключено`, ...state.log].slice(0, 30),
    cooldowns: updatedCooldowns,
    heroBuffs: filtered,
  });
  
  return true; // Toggle вимкнено
}

/**
 * Створює об'єкт бафу для toggle скілу
 */
export function createToggleBuff(
  def: SkillDefinition,
  effList: any[],
  now: number,
  finalDurationSec: number,
  isToggle: boolean
): any {
  
  // Діагностика для Rapid Shot (id 99)
  if (def.id === 99 && import.meta.env.DEV) {
    console.log(`[createToggleBuff] Rapid Shot creating buff:`, {
      effList,
      effListDetails: effList.map((e: any) => ({
        stat: e.stat,
        mode: e.mode,
        multiplier: e.multiplier,
        value: e.value,
      })),
    });
  }
  
  // Діагностика для toggle скілів
  if (isToggle && import.meta.env.DEV) {
    console.log(`[TOGGLE] createToggleBuff for ${def.name} (${def.id}):`, {
      isToggle,
      expiresAt: isToggle ? Number.MAX_SAFE_INTEGER : now + finalDurationSec * 1000,
      finalDurationSec,
      defDuration: def.duration,
    });
  }
  
  return {
    id: def.id,
    name: def.name,
    icon: def.icon || "/skills/attack.jpg",
    stackType: def.stackType,
    buffGroup: def.buffGroup,
    effects: effList,
    expiresAt: isToggle ? Number.MAX_SAFE_INTEGER : now + finalDurationSec * 1000,
    startedAt: now,
    durationMs: isToggle ? undefined : finalDurationSec * 1000,
    // Зберігаємо tick інформацію для toggle скілів
    ...(isToggle && (def.hpPerTick !== undefined || def.mpPerTick !== undefined)
      ? {
          hpPerTick: def.hpPerTick,
          mpPerTick: def.mpPerTick,
          tickInterval: def.tickInterval ?? 5,
          lastTickAt: now,
        }
      : {}),
  };
}

