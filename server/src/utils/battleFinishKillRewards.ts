/**
 * Серверне нарахування EXP/SP за kill у battle-finish (єдине джерело правди).
 * Клієнтські earnedExp/earnedSp у тілі запиту ігноруються.
 */
import { lookupMobRegistry } from "./serverDropCalculator";

const MAX_EXP_PER_KILL = 5_000_000;
const MAX_SP_PER_KILL = 50_000;

function mobSpGainFromRegistry(exp: number, spFromRegistry: number, _mobLevel: number): number {
  if (typeof spFromRegistry === "number" && Number.isFinite(spFromRegistry) && spFromRegistry > 0) {
    return Math.floor(spFromRegistry);
  }
  const e = Number(exp);
  return Math.max(1, Math.round(e / 15));
}

/** Як у serverDropCalculator premium для ресурсів: x2 лише якщо моб не старіший за героя більш ніж на 10 рівнів. */
function premiumMultiplierForKillRewards(mobLevel: number, heroLevel: number, premiumUntil: number): number {
  if (!premiumUntil || premiumUntil <= Date.now()) return 1;
  if (mobLevel <= heroLevel + 10) return 2;
  return 1;
}

function applyPartySplitToKiller(exp: number, sp: number, partySize: number): { exp: number; sp: number } {
  const n = Math.max(1, Math.min(9, Math.floor(partySize)));
  if (n <= 1) return { exp, sp };
  const eEach = Math.floor(exp / n);
  const sEach = Math.floor(sp / n);
  return {
    exp: exp - eEach * (n - 1),
    sp: sp - sEach * (n - 1),
  };
}

export function computeBattleFinishKillRewards(input: {
  mobId: string;
  zoneId?: string;
  heroLevel: number;
  premiumUntil: number;
  partySize: number;
  lootMultiplier: number;
}): { earnedExp: number; earnedSp: number } {
  const mob = lookupMobRegistry(input.mobId, input.zoneId);
  if (!mob) {
    return { earnedExp: 0, earnedSp: 0 };
  }
  const expBase = Math.max(0, Math.floor(Number(mob.exp ?? 0)));
  const spBase = mobSpGainFromRegistry(expBase, mob.sp, mob.level);

  const lm = Math.max(1, Math.min(10, Math.floor(Number(input.lootMultiplier) || 1)));
  let exp = expBase;
  let sp = spBase;
  if (lm > 1) {
    exp = Math.round(exp * lm);
    sp = Math.round(sp * lm);
  }

  const pm = premiumMultiplierForKillRewards(mob.level, input.heroLevel, input.premiumUntil);
  exp = Math.round(exp * pm);
  sp = Math.round(sp * pm);

  const { exp: expParty, sp: spParty } = applyPartySplitToKiller(exp, sp, input.partySize);
  exp = expParty;
  sp = spParty;

  return {
    earnedExp: Math.max(0, Math.min(MAX_EXP_PER_KILL, exp)),
    earnedSp: Math.max(0, Math.min(MAX_SP_PER_KILL, sp)),
  };
}
