/**
 * Серверне застосування PvE debuff / stun по мобу (без довіри до mobBuffs з клієнта).
 */

import skillCastMetaJson from "../data/skillCastMeta.generated.json";
import { applyServerToggleResourceTicks } from "./applyServerToggleTicks";
import { syncHeroJsonResourcePercentsToAbsolutes } from "./pveHeroResourceSync";
import { applyMobBuffsToCombat, cleanupBattleBuffs } from "./pveBattleBuffsLite";

type SkillMetaRow = {
  id: number;
  name: string;
  category: string;
  duration: number;
  cooldown: number;
  icon?: string;
  stackType?: string;
  powerType?: string;
  hpPerTick?: number;
  tickInterval?: number;
  levels: Record<string, { mpCost: number; power: number; requiredLevel?: number }>;
  effectsByLevel: Record<string, any[]>;
  stun?: { chance: number; durationSec: number };
};

const skillCastMeta = skillCastMetaJson as {
  version: number;
  skills: Record<string, SkillMetaRow>;
  professionToSkillIds: Record<string, number[]>;
};

const MOB_STUN_VISUAL_STACK = "MOB_STUN_VISUAL";
const BANE_IDS = new Set([1350, 1351]);

function professionAllowsSkill(skillId: number, heroJson: any, classId: string): boolean {
  const keys = [heroJson?.profession, heroJson?.klass, heroJson?.classId, classId]
    .filter(Boolean)
    .map((x) => String(x).trim());
  for (const k of keys) {
    const list = skillCastMeta.professionToSkillIds[k];
    if (Array.isArray(list) && list.includes(skillId)) return true;
  }
  return false;
}

function ensureSessionMobBases(sess: any) {
  if (typeof sess.mobPDefBase !== "number") sess.mobPDefBase = Math.max(1, Math.floor(Number(sess.mobPDef) || 1));
  if (typeof sess.mobMDefBase !== "number") sess.mobMDefBase = Math.max(1, Math.floor(Number(sess.mobMDef) || 1));
  if (sess.mobEvasionBase === undefined) {
    sess.mobEvasionBase = Math.max(0, Math.floor(Number(sess.mobEvasion) || 0));
  }
  if (sess.fireResistBase === undefined) sess.fireResistBase = Number(sess.fireResist) || 0;
  if (sess.waterResistBase === undefined) sess.waterResistBase = Number(sess.waterResist) || 0;
  if (sess.windResistBase === undefined) sess.windResistBase = Number(sess.windResist) || 0;
  if (sess.earthResistBase === undefined) sess.earthResistBase = Number(sess.earthResist) || 0;
  if (sess.holyResistBase === undefined) sess.holyResistBase = Number(sess.holyResist) || 0;
  if (sess.darkResistBase === undefined) sess.darkResistBase = Number(sess.darkResist) || 0;
}

function applyMobBuffsToSession(sess: any, mobBuffsClean: any[], now: number) {
  ensureSessionMobBases(sess);
  const baseP = Math.max(1, Math.floor(Number(sess.mobPDefBase ?? sess.mobPDef) || 1));
  const baseM = Math.max(1, Math.floor(Number(sess.mobMDefBase ?? sess.mobMDef) || 1));
  const baseE = Math.max(0, Math.floor(Number(sess.mobEvasionBase ?? sess.mobEvasion) || 0));
  const merged = applyMobBuffsToCombat(
    {
      pDef: baseP,
      mDef: baseM,
      evasion: baseE,
      fireResist: Number(sess.fireResistBase ?? 0) || 0,
      waterResist: Number(sess.waterResistBase ?? 0) || 0,
      windResist: Number(sess.windResistBase ?? 0) || 0,
      earthResist: Number(sess.earthResistBase ?? 0) || 0,
      holyResist: Number(sess.holyResistBase ?? 0) || 0,
      darkResist: Number(sess.darkResistBase ?? 0) || 0,
    },
    mobBuffsClean
  );
  sess.mobPDef = merged.pDef;
  sess.mobMDef = merged.mDef;
  sess.mobEvasion = merged.evasion;
  sess.fireResist = merged.fireResist;
  sess.waterResist = merged.waterResist;
  sess.windResist = merged.windResist;
  sess.earthResist = merged.earthResist;
  sess.holyResist = merged.holyResist;
  sess.darkResist = merged.darkResist;
  sess.mobBuffs = mobBuffsClean;
}

function sanitizeBuiltMobDebuffEffects(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e === "object" && typeof e.stat === "string")
    .slice(0, 8)
    .map((e: any) => ({
      stat: String(e.stat).slice(0, 48),
      mode: e.mode === "percent" ? "percent" : e.mode === "multiplier" ? "multiplier" : "flat",
      value: Math.max(-200, Math.min(200, Number(e.value) || 0)),
      ...(typeof e.multiplier === "number" ? { multiplier: e.multiplier } : {}),
    }));
}

function mergeStunVisual(mobBuffs: any[], visual: any): any[] {
  const without = mobBuffs.filter(
    (b) => !(b && b.stackType === MOB_STUN_VISUAL_STACK && b.id === visual.id)
  );
  return [visual, ...without];
}

function createStunVisual(meta: SkillMetaRow, now: number, until: number, durationMs: number) {
  return {
    id: meta.id,
    name: meta.name,
    icon: meta.icon || "/skills/attack.jpg",
    stackType: MOB_STUN_VISUAL_STACK,
    effects: [] as any[],
    expiresAt: until,
    startedAt: now,
    durationMs,
    source: "skill" as const,
  };
}

export type PveMobDebuffResult =
  | { ok: true; nextHeroJson: any; logLine: string }
  | { ok: false; code: string; message?: string };

export function applyPveMobDebuffSnapshot(args: {
  heroJson: any;
  classId: string;
  skillId: number;
  nowMs: number;
}): PveMobDebuffResult {
  const { heroJson: hjIn, classId, skillId, nowMs: now } = args;
  const hj = hjIn && typeof hjIn === "object" ? { ...hjIn } : {};
  const sess: any = hj.battleSession;
  if (!sess || Number(sess.v) !== 1 || typeof sess.mobHP !== "number") {
    return { ok: false, code: "no_battle_session", message: "No active PvE battle on server" };
  }
  if (String(sess.zoneId || "") === "fishing") {
    return { ok: false, code: "fishing_local", message: "Fishing uses local combat" };
  }
  const mobHp = Math.max(0, Math.floor(Number(sess.mobHP)));
  if (mobHp <= 0) {
    return { ok: false, code: "mob_dead", message: "Mob already defeated" };
  }

  if (BANE_IDS.has(skillId)) {
    return { ok: false, code: "client_only_debuff", message: "Bane skills not supported on this endpoint" };
  }

  const meta = skillCastMeta.skills[String(skillId)];
  if (!meta || meta.category !== "debuff") {
    return { ok: false, code: "unsupported_skill", message: "Not a server debuff skill" };
  }

  if (!professionAllowsSkill(skillId, hj, classId)) {
    return { ok: false, code: "forbidden_skill", message: "Skill not allowed for this profession" };
  }

  const learned = (Array.isArray(hj.skills) ? hj.skills : []).find((s: any) => Number(s?.id) === skillId);
  if (!learned) {
    return { ok: false, code: "not_learned", message: "Skill not learned" };
  }

  const level = Math.max(1, Math.floor(Number(learned.level ?? 1)));
  const levelRow = meta.levels[String(level)];
  if (!levelRow) {
    return { ok: false, code: "invalid_level", message: "No level data for skill" };
  }

  const mpCost = Math.max(0, Number(levelRow.mpCost ?? 0) || 0);

  applyServerToggleResourceTicks(hj, now);
  const mpAfterToggle = Number(hj.mp ?? 0);
  if (mpAfterToggle < mpCost) {
    return { ok: false, code: "not_enough_mp", message: "Not enough MP" };
  }
  hj.mp = mpAfterToggle - mpCost;

  let mobBuffs = cleanupBattleBuffs(Array.isArray(sess.mobBuffs) ? sess.mobBuffs : [], now);

  if (meta.stun) {
    const chance = Math.max(0, Math.min(100, Number(meta.stun.chance) || 100));
    const applied = Math.random() * 100 < chance;
    if (!applied) {
      applyMobBuffsToSession(sess, mobBuffs, now);
      hj.battleSession = sess;
      syncHeroJsonResourcePercentsToAbsolutes(hj);
      return {
        ok: true,
        nextHeroJson: hj,
        logLine: `${meta.name}: не спрацював (шанс ${chance}%)`,
      };
    }
    const durationSec = Math.max(0.1, Number(meta.stun.durationSec) || 1.5);
    const durationMs = Math.round(durationSec * 1000);
    const until = now + durationMs;
    sess.mobStunnedUntil = until;
    const visual = createStunVisual(meta, now, until, durationMs);
    mobBuffs = mergeStunVisual(mobBuffs, visual);
    applyMobBuffsToSession(sess, cleanupBattleBuffs(mobBuffs, now), now);
    hj.battleSession = sess;
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    return {
      ok: true,
      nextHeroJson: hj,
      logLine: `${meta.name}: ціль оглушено на ${durationSec} сек`,
    };
  }

  const effListRaw = Array.isArray(meta.effectsByLevel[String(level)]) ? meta.effectsByLevel[String(level)] : [];
  const effSan = sanitizeBuiltMobDebuffEffects(effListRaw);
  const hasDot = meta.hpPerTick != null && Number(meta.hpPerTick) > 0;
  if (effSan.length === 0 && !hasDot) {
    hj.mp = mpAfterToggle;
    return { ok: false, code: "no_effect", message: "Skill has no applicable debuff effect on server" };
  }

  const durationSec = Number(meta.duration ?? 10) || 10;
  const isSameDebuff = (b: any) =>
    b && (b.id === meta.id || b.name === meta.name || (meta.stackType && b.stackType === meta.stackType));
  mobBuffs = mobBuffs.filter((b) => !isSameDebuff(b));

  const entry: any = {
    id: meta.id,
    name: meta.name,
    icon: meta.icon || "/skills/attack.jpg",
    stackType: meta.stackType,
    effects: effSan,
    expiresAt: now + durationSec * 1000,
    startedAt: now,
    durationMs: durationSec * 1000,
    lastTickAt: now,
  };
  if (meta.hpPerTick !== undefined) entry.hpPerTick = meta.hpPerTick;
  if (meta.tickInterval !== undefined) entry.tickInterval = meta.tickInterval;

  mobBuffs = [...mobBuffs, entry];
  applyMobBuffsToSession(sess, cleanupBattleBuffs(mobBuffs, now), now);
  hj.battleSession = sess;
  syncHeroJsonResourcePercentsToAbsolutes(hj);

  return {
    ok: true,
    nextHeroJson: hj,
    logLine: `${meta.name} застосовано до цілі`,
  };
}
