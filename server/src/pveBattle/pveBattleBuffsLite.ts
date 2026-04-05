/** Мінімальна логіка бафів моба для pDef/mDef/evasion/резистів (узгоджено з client buffs). */

const RESIST_STATS = new Set([
  "fireResist",
  "waterResist",
  "windResist",
  "earthResist",
  "holyResist",
  "darkResist",
]);

const ALLOW = new Set(["pDef", "mDef", "evasion", ...RESIST_STATS]);

export type MobCombatBase = {
  pDef: number;
  mDef: number;
  evasion: number;
  fireResist: number;
  waterResist: number;
  windResist: number;
  earthResist: number;
  holyResist: number;
  darkResist: number;
};

export function cleanupBattleBuffs(buffs: any[], now: number): any[] {
  const list = Array.isArray(buffs) ? buffs : [];
  return list
    .filter((b) => b && typeof b === "object")
    .filter((b) => Number(b.expiresAt) > now)
    .slice(0, 24);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function applyMobBuffsToCombat(base: MobCombatBase, buffs: any[]): MobCombatBase {
  const merged = { ...base };
  const pctBy: Record<string, number> = {};
  const flatBy: Record<string, number> = {};

  for (const b of buffs || []) {
    const effs = Array.isArray(b?.effects) ? b.effects : [];
    for (const eff of effs) {
      if (!eff || typeof eff !== "object") continue;
      const stat = String(eff.stat || "");
      if (!ALLOW.has(stat)) continue;
      const mode = String(eff.mode || "flat");
      const val = Number(eff.value) || 0;
      if (mode === "percent") {
        pctBy[stat] = (pctBy[stat] ?? 0) + val;
      } else {
        flatBy[stat] = (flatBy[stat] ?? 0) + val;
      }
    }
  }

  for (const stat of ALLOW) {
    const pv = pctBy[stat] ?? 0;
    const fv = flatBy[stat] ?? 0;
    const cur = Number((merged as any)[stat]) || 0;
    if (RESIST_STATS.has(stat)) {
      const next = clamp(cur * (1 + pv / 100) + fv, -80, 95);
      (merged as any)[stat] = next;
    } else if (stat === "evasion") {
      const next = Math.round(cur * (1 + pv / 100) + fv);
      (merged as any).evasion = clamp(next, 0, 120);
    } else {
      const next = Math.round(cur * (1 + pv / 100) + fv);
      (merged as any)[stat] = stat === "pDef" || stat === "mDef" ? Math.max(1, next) : next;
    }
  }
  return merged;
}
