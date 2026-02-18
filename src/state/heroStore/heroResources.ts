/**
 * ЄДИНЕ МІСЦЕ — уся логіка HP/MP/CP: max, load, save, death, resurrect.
 * Імпортуй звідси все, що повʼязано з ресурсами героя.
 */

// ─── Re-exports (єдиний пункт імпорту для ресурсів) ─────────────────────────
export { getMaxResources } from "../battle/helpers/getMaxResources";
export type { HeroResourcesSource } from "../battle/helpers/getMaxResources";

// ─── Мертвий тільки з heroJson (НЕ hp<=0) ──────────────────────────────────
export function isHeroDead(hero: any): boolean {
  const hj = hero?.heroJson || {};
  return Boolean(hj.isDead) || Number(hj.deadAt || 0) > 0;
}

export function isDeadFromHeroJson(heroJson: any): boolean {
  const hj = heroJson || {};
  return Boolean(hj.isDead) || Number(hj.deadAt || 0) > 0;
}

// ─── Відновлення з відсотка при load ───────────────────────────────────────
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type RestoreResourceArgs = {
  percentRaw: any;
  fullFlag: boolean;
  savedValueRaw: any;
  savedMaxRaw: any;
  finalMax: number;
  isDead: boolean;
};

export function restoreFromPercentOrFallback(args: RestoreResourceArgs): number {
  const { percentRaw, fullFlag, savedValueRaw, savedMaxRaw, finalMax, isDead } = args;
  const finalMaxSafe = Math.max(1, Number(finalMax) || 1);
  const percentNum = Number(percentRaw);
  const hasPercent = Number.isFinite(percentNum);
  const savedValue = Number(savedValueRaw);
  Number(savedMaxRaw); // unused but for API

  if (isDead) return 0;
  if (hasPercent) {
    const p = clamp01(percentNum);
    if (p > 0) return Math.min(finalMaxSafe, Math.max(0, Math.round(p * finalMaxSafe)));
  }
  if (fullFlag) return finalMaxSafe;
  if (Number.isFinite(savedValue) && savedValue > 0) {
    return Math.min(finalMaxSafe, Math.max(0, Math.round(savedValue)));
  }
  return finalMaxSafe;
}

// ─── Save: поля heroJson для hp/mp/cp/isDead/deadAt/percent/full ──────────
export type BaseMax = { maxHp: number; maxMp: number; maxCp: number };
export type BuffedMax = { maxHp: number; maxMp: number; maxCp: number };

export function buildResourceFieldsForSave(
  hero: any,
  baseMax: BaseMax,
  buffedMax: BuffedMax
): {
  hp: number;
  mp: number;
  cp: number;
  maxHp: number;
  maxMp: number;
  maxCp: number;
  hpFull: boolean;
  mpFull: boolean;
  cpFull: boolean;
  hpPercent: number;
  mpPercent: number;
  cpPercent: number;
  isDead: boolean;
  deadAt: number;
} {
  const runtimeHp = Math.max(1, buffedMax.maxHp);
  const runtimeMp = Math.max(1, buffedMax.maxMp);
  const runtimeCp = Math.max(1, buffedMax.maxCp);
  const safe = (raw: any, fallback: number) => {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  const hpNow = safe(hero.hp, runtimeHp);
  const mpNow = safe(hero.mp, runtimeMp);
  const cpNow = safe(hero.cp, runtimeCp);
  const hpPercent = clamp01(runtimeHp > 0 ? hpNow / runtimeHp : 1);
  const mpPercent = clamp01(runtimeMp > 0 ? mpNow / runtimeMp : 1);
  const cpPercent = clamp01(runtimeCp > 0 ? cpNow / runtimeCp : 1);
  const hpToSave = Math.min(baseMax.maxHp, Math.max(0, Math.round(hpPercent * baseMax.maxHp)));
  const mpToSave = Math.min(baseMax.maxMp, Math.max(0, Math.round(mpPercent * baseMax.maxMp)));
  const cpToSave = Math.min(baseMax.maxCp, Math.max(0, Math.round(cpPercent * baseMax.maxCp)));
  const currentHeroJson = hero?.heroJson || {};
  return {
    hp: hpToSave,
    mp: mpToSave,
    cp: cpToSave,
    maxHp: baseMax.maxHp,
    maxMp: baseMax.maxMp,
    maxCp: baseMax.maxCp,
    hpFull: hpPercent >= 1,
    mpFull: mpPercent >= 1,
    cpFull: cpPercent >= 1,
    hpPercent,
    mpPercent,
    cpPercent,
    isDead: Boolean(currentHeroJson.isDead),
    deadAt: Number(currentHeroJson.deadAt) || 0,
  };
}

// ─── Load: finalHp, finalMp, finalCp з heroJson + isDead ────────────────────
export function getFinalResourcesOnLoad(
  heroJson: any,
  baseMax: BaseMax,
  buffedMax: BuffedMax,
  isDead: boolean,
  forceFull?: { hp?: boolean; mp?: boolean; cp?: boolean }
): { finalHp: number; finalMp: number; finalCp: number } {
  const hj = heroJson || {};
  const finalHp = restoreFromPercentOrFallback({
    percentRaw: hj.hpPercent,
    fullFlag: Boolean(forceFull?.hp) || Boolean(hj.hpFull),
    savedValueRaw: hj.hp,
    savedMaxRaw: hj.maxHp,
    finalMax: buffedMax.maxHp,
    isDead,
  });
  const finalMp = restoreFromPercentOrFallback({
    percentRaw: hj.mpPercent,
    fullFlag: Boolean(forceFull?.mp) || Boolean(hj.mpFull),
    savedValueRaw: hj.mp,
    savedMaxRaw: hj.maxMp,
    finalMax: buffedMax.maxMp,
    isDead,
  });
  const finalCp = restoreFromPercentOrFallback({
    percentRaw: hj.cpPercent,
    fullFlag: Boolean(forceFull?.cp) || Boolean(hj.cpFull),
    savedValueRaw: hj.cp,
    savedMaxRaw: hj.maxCp,
    finalMax: buffedMax.maxCp,
    isDead,
  });
  return { finalHp, finalMp, finalCp };
}

// ─── Death: патч для heroJson при смерті ───────────────────────────────────
export function getDeathHeroJsonPatch(deadAt: number = Date.now()): {
  isDead: true;
  deadAt: number;
  heroBuffs: [];
} {
  return { isDead: true, deadAt, heroBuffs: [] };
}

// ─── Resurrect: патч для heroJson при оживленні ────────────────────────────
export function getResurrectHeroJsonPatch(
  ratio: number,
  maxHp: number,
  maxMp: number,
  maxCp: number,
  currentCp?: number
): {
  isDead: false;
  deadAt: 0;
  heroBuffs: [];
  hp: number;
  mp: number;
  cp: number;
  hpFull: boolean;
  mpFull: boolean;
  cpFull: boolean;
  hpPercent: 1;
  mpPercent: 1;
  cpPercent: 1;
} {
  const hp = Math.max(1, Math.round(maxHp * ratio));
  const mp = Math.max(1, Math.round(maxMp * ratio));
  const cp = Math.min(maxCp, Math.max(0, currentCp ?? maxCp));
  return {
    isDead: false,
    deadAt: 0,
    heroBuffs: [],
    hp,
    mp,
    cp,
    hpFull: ratio >= 1,
    mpFull: ratio >= 1,
    cpFull: cp >= maxCp,
    hpPercent: 1,
    mpPercent: 1,
    cpPercent: 1,
  };
}

// Допомога: baseMax з hero — використовуй getMaxResources(hero) (реекспорт вище).
