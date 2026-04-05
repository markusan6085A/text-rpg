/**
 * Server-side buff merge helpers (aligned with client buffHelpers / toggleSkill).
 */

export const SONIC_FOCUS_ID = 8;
export const FOCUSED_FORCE_ID = 50;
export const MAX_FOCUS_STACKS = 8;
export const FOCUS_DURATION_MS = 10 * 60 * 1000;
export const MAX_FOCUSED_FORCE_STACKS = 7;
export const FOCUSED_FORCE_DURATION_MS = 10 * 60 * 1000;

export type SkillStub = {
  id: number;
  name: string;
  category?: string;
  code?: string;
  buffGroup?: string;
  stackType?: string;
  icon?: string;
  hpPerTick?: number;
  mpPerTick?: number;
  tickInterval?: number;
};

export function createIsSameBuff(def: SkillStub) {
  const isWarcryerBuff = def.code && def.code.startsWith("WC_") && def.buffGroup;
  return (b: any) => {
    if (isWarcryerBuff && def.buffGroup) {
      return b.buffGroup === def.buffGroup && String(b.buffGroup).startsWith("WC_");
    }
    return b.id === def.id || b.name === def.name || (def.stackType && b.stackType === def.stackType);
  };
}

export function isBuffBetter(newBuff: any, oldBuff: any): boolean {
  if (newBuff.id !== oldBuff.id) return false;
  const sumPow = (buff: any) =>
    (buff.effects || []).reduce((sum: number, eff: any) => {
      if (eff.mode === "multiplier") return sum + (eff.multiplier || 1);
      if (eff.mode === "percent") return sum + Math.abs(eff.value || 0);
      return sum + Math.abs(eff.value || 0);
    }, 0);
  return sumPow(newBuff) >= sumPow(oldBuff);
}

export function processWarcryerBuffs(newBuffs: any[], def: SkillStub, heroLevel: number): any[] {
  const isWarcryerBuff = def.code && def.code.startsWith("WC_") && def.buffGroup;
  if (!isWarcryerBuff || !def.buffGroup) return newBuffs;
  const maxWcBuffs = heroLevel >= 76 ? 4 : 3;
  const allWcBuffs = newBuffs.filter((b: any) => b.buffGroup && String(b.buffGroup).startsWith("WC_"));
  if (allWcBuffs.length <= maxWcBuffs) return newBuffs;
  const newBuffId = def.id;
  const oldWcBuffs = allWcBuffs.filter((b: any) => b.id !== newBuffId);
  const sortedOldWcBuffs = [...oldWcBuffs].sort((a: any, b: any) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
  const toRemove = sortedOldWcBuffs.slice(0, allWcBuffs.length - maxWcBuffs);
  const toRemoveIds = new Set(toRemove.map((b: any) => b.id));
  return newBuffs.filter(
    (b: any) => !(b.buffGroup && String(b.buffGroup).startsWith("WC_") && toRemoveIds.has(b.id))
  );
}

export function processStackingBuffs(
  newBuffs: any[],
  def: SkillStub,
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

export function createToggleBuff(
  def: SkillStub,
  effList: any[],
  now: number,
  finalDurationSec: number,
  isToggle: boolean
): any {
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

export function consumeSonicFocus(newBuffs: any[], def: SkillStub): any[] {
  return newBuffs;
}
