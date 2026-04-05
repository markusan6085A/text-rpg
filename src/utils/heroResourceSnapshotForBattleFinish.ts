import type { Hero } from "../types/Hero";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * newHp/newMp/newCp для POST battle-finish: у просторі base max, як у heroPersistence PUT.
 * Інакше сервер клампить до hj.maxHp (база), а клієнт шле абсолютні значення з buffed HUD → «різнє» HP.
 */
export function heroResourcesForBattleFinishPayload(hero: Hero): { hp: number; mp: number; cp: number } {
  const hj = ((hero as any).heroJson || {}) as Record<string, any>;
  const baseMaxHp = Math.max(1, Number((hero as any).baseMaxHp ?? hj.maxHp ?? hero.maxHp ?? 1) || 1);
  const baseMaxMp = Math.max(1, Number((hero as any).baseMaxMp ?? hj.maxMp ?? hero.maxMp ?? 1) || 1);
  const baseMaxCp = Math.max(
    1,
    Number((hero as any).baseMaxCp ?? hj.maxCp ?? hero.maxCp ?? Math.max(1, Math.round(baseMaxHp * 0.6))) || 1,
  );
  const now = Date.now();
  const buffs = cleanupBuffs(Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [], now);
  const buffedMax = computeBuffedMaxResources(
    { maxHp: baseMaxHp, maxMp: baseMaxMp, maxCp: baseMaxCp },
    buffs as any,
  );
  const runtimeMaxHp = Math.max(1, buffedMax.maxHp);
  const runtimeMaxMp = Math.max(1, buffedMax.maxMp);
  const runtimeMaxCp = Math.max(1, buffedMax.maxCp);

  const hpNow = Number(hero.hp);
  const mpNow = Number(hero.mp);
  const cpNow = Number(hero.cp);
  const hpP = clamp01((Number.isFinite(hpNow) ? hpNow : runtimeMaxHp) / runtimeMaxHp);
  const mpP = clamp01((Number.isFinite(mpNow) ? mpNow : runtimeMaxMp) / runtimeMaxMp);
  const cpP = clamp01((Number.isFinite(cpNow) ? cpNow : runtimeMaxCp) / runtimeMaxCp);

  return {
    hp: Math.min(baseMaxHp, Math.max(0, Math.round(hpP * baseMaxHp))),
    mp: Math.min(baseMaxMp, Math.max(0, Math.round(mpP * baseMaxMp))),
    cp: Math.min(baseMaxCp, Math.max(0, Math.round(cpP * baseMaxCp))),
  };
}
