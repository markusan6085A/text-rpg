import skillCastMetaJson from "../data/skillCastMeta.generated.json";
import {
  FOCUSED_FORCE_ID,
  SONIC_FOCUS_ID,
  consumeSonicFocus,
  createIsSameBuff,
  createToggleBuff,
  isBuffBetter,
  processStackingBuffs,
  processWarcryerBuffs,
  type SkillStub,
} from "./buffLogicServer";
import { cleanupExpiredBuffs, sanitizeHeroBuffsForServer } from "./sanitizeHeroBuffsServer";
import { applyServerToggleResourceTicks } from "../pveBattle/applyServerToggleTicks";
import { applyPvePassiveMpCpRegen } from "../pveBattle/applyPvePassiveMpCpRegen";

type SkillMetaRow = {
  id: number;
  name: string;
  category: string;
  isToggle: boolean;
  duration: number;
  cooldown: number;
  code?: string;
  icon?: string;
  stackType?: string;
  buffGroup?: string;
  powerType?: string;
  resourceHeal?: {
    hp?: number;
    mp?: number;
    cp?: number;
    hpPct?: number;
    mpPct?: number;
    cpPct?: number;
  };
  hpPerTick?: number;
  mpPerTick?: number;
  tickInterval?: number;
  levels: Record<string, { mpCost: number; power: number; requiredLevel?: number }>;
  effectsByLevel: Record<string, any[]>;
};

const skillCastMeta = skillCastMetaJson as {
  version: number;
  skills: Record<string, SkillMetaRow>;
  professionToSkillIds: Record<string, number[]>;
};

function toStub(meta: SkillMetaRow): SkillStub {
  return {
    id: meta.id,
    name: meta.name,
    category: meta.category,
    code: meta.code,
    buffGroup: meta.buffGroup,
    stackType: meta.stackType,
    icon: meta.icon,
    hpPerTick: meta.hpPerTick,
    mpPerTick: meta.mpPerTick,
    tickInterval: meta.tickInterval,
  };
}

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

const clamp = (v: number, m: number) => Math.min(m, Math.max(0, v));

export type PveSelfBuffApplyResult =
  | { ok: true; nextHeroJson: any; logLine: string }
  | { ok: false; code: string; message?: string };

export function applyPveSelfBuffSnapshot(args: {
  heroJson: any;
  classId: string;
  skillId: number;
  nowMs: number;
}): PveSelfBuffApplyResult {
  const { heroJson: hjIn, classId, skillId, nowMs: now } = args;
  const hj = hjIn && typeof hjIn === "object" ? { ...hjIn } : {};

  const meta = skillCastMeta.skills[String(skillId)];
  if (!meta) {
    return { ok: false, code: "unsupported_skill", message: "Skill cannot be self-cast on server" };
  }

  if (meta.category === "debuff") {
    return {
      ok: false,
      code: "wrong_endpoint",
      message: "Debuffs use POST .../pve-battle-debuff",
    };
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

  const sessForRegen = hj.battleSession;
  if (sessForRegen && Number(sessForRegen.v) === 1) {
    const sessStarted = Number(sessForRegen.startedAt) || 0;
    const youngBattle = sessStarted > 0 && now - sessStarted < 15_000;
    applyServerToggleResourceTicks(hj, now, youngBattle ? { maxTickCatchup: 2 } : undefined);
    applyPvePassiveMpCpRegen(hj, now);
  }

  const mpCost = Math.max(0, Number(levelRow.mpCost ?? 0) || 0);
  const heroLevel = Math.max(1, Math.floor(Number(hj.level ?? 1)));
  const stub = toStub(meta);
  const isToggle = meta.isToggle === true;

  if (meta.category === "heal") {
    let rawBuffsHeal = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
    let activeBuffsHeal = cleanupExpiredBuffs(rawBuffsHeal, now);
    const maxHpH = Math.max(1, Number(hj.maxHp ?? 1));
    let curHpH = Number(hj.hp ?? 0);
    const curMpH = Number(hj.mp ?? 0);
    let curCpH = Number(hj.cp ?? 0);

    if (skillId === 1271 && curHpH > maxHpH * 0.25) {
      return {
        ok: false,
        code: "skill_condition",
        message: "Salvation: только при HP ниже 25%",
      };
    }

    if (curMpH < mpCost) {
      return { ok: false, code: "not_enough_mp", message: "Not enough MP" };
    }

    const bs = hj.battleStats && typeof hj.battleStats === "object" ? hj.battleStats : {};
    const healBonus = Math.max(0, Number((bs as any).healPower ?? 0) || 0);
    const healInv = Math.max(0, Number((bs as any).healReceivedBonus ?? 0) || 0);
    const basePower = Number(levelRow.power ?? 0) || 0;
    let healAmountRaw =
      meta.powerType === "percent" ? Math.round(maxHpH * (basePower / 100)) : basePower;
    let healAmount = Math.round(healAmountRaw * (1 + healBonus / 100));
    healAmount = Math.round(healAmount * (1 + healInv / 100));

    const nextMpH = curMpH - mpCost;
    curHpH = clamp(curHpH + healAmount, maxHpH);
    hj.hp = curHpH;
    hj.mp = Math.max(0, nextMpH);
    hj.cp = curCpH;
    hj.heroBuffs = sanitizeHeroBuffsForServer(activeBuffsHeal);
    return {
      ok: true,
      nextHeroJson: hj,
      logLine: `Вы использовали ${meta.name} (+${healAmount} HP)`,
    };
  }

  let rawBuffs = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
  let activeBuffs = cleanupExpiredBuffs(rawBuffs, now);
  const isSameBuff = createIsSameBuff(stub);

  if (isToggle && activeBuffs.some(isSameBuff)) {
    const filtered = activeBuffs.filter((b) => !isSameBuff(b));
    hj.heroBuffs = sanitizeHeroBuffsForServer(filtered);
    const name = meta.name;
    return {
      ok: true,
      nextHeroJson: hj,
      logLine: `Ваша аура [${name}] закінчилася.`,
    };
  }

  const curMp = Number(hj.mp ?? 0);
  if (curMp < mpCost) {
    return { ok: false, code: "not_enough_mp", message: "Not enough MP" };
  }

  let nextMp = curMp - mpCost;
  let curHp = Number(hj.hp ?? 0);
  const maxHp = Math.max(1, Number(hj.maxHp ?? 1));
  const maxMp = Math.max(1, Number(hj.maxMp ?? 1));
  const maxCp = Math.max(1, Number(hj.maxCp ?? 1));
  let curCp = Number(hj.cp ?? 0);

  const durationSec = isToggle ? 0 : (Number(meta.duration ?? 10) || 10);
  const finalDurationSec = durationSec;

  const effList = Array.isArray(meta.effectsByLevel[String(level)]) ? meta.effectsByLevel[String(level)] : [];

  const filteredBase = activeBuffs.filter((b) => !isSameBuff(b));
  let newBuffs: any[] = filteredBase;
  newBuffs = processStackingBuffs(newBuffs, stub, effList, now, activeBuffs);

  if (
    effList.length > 0 &&
    skillId !== SONIC_FOCUS_ID &&
    skillId !== FOCUSED_FORCE_ID &&
    meta.category !== "debuff"
  ) {
    const newBuff = createToggleBuff(stub, effList, now, finalDurationSec, isToggle);
    const existingBuff = activeBuffs.find((b: any) => b.id === skillId);
    if (existingBuff) {
      if (isBuffBetter(newBuff, existingBuff)) {
        newBuffs = [...newBuffs, newBuff];
      }
    } else {
      newBuffs = [...newBuffs, newBuff];
    }
  }

  newBuffs = processWarcryerBuffs(newBuffs, stub, heroLevel);
  newBuffs = consumeSonicFocus(newBuffs, stub);

  const buffWasAdded = newBuffs.some((b) => b.id === skillId);

  let battleRoarHp = 0;
  if (skillId === 121 && meta.category === "buff") {
    const pct = Number(levelRow.power ?? 10);
    battleRoarHp = Math.round(maxHp * (pct / 100));
    curHp = clamp(curHp + battleRoarHp, maxHp);
  }

  const rh = meta.resourceHeal;
  if (rh) {
    const addHp = (rh.hp ?? 0) + (rh.hpPct ? Math.round(maxHp * rh.hpPct) : 0);
    const addMp = (rh.mp ?? 0) + (rh.mpPct ? Math.round(maxMp * rh.mpPct) : 0);
    const addCp = (rh.cp ?? 0) + (rh.cpPct ? Math.round(maxCp * rh.cpPct) : 0);
    curHp = clamp(curHp + addHp, maxHp);
    nextMp = clamp(nextMp + addMp, maxMp);
    curCp = clamp(curCp + addCp, maxCp);
  }

  const hasBattleRoar = skillId === 121 && meta.category === "buff" && battleRoarHp > 0;
  const hasResourceHeal = !!rh && ((rh.hp ?? 0) !== 0 || (rh.mp ?? 0) !== 0 || (rh.cp ?? 0) !== 0 || !!rh.hpPct || !!rh.mpPct || !!rh.cpPct);
  if (
    meta.category === "buff" &&
    effList.length === 0 &&
    !buffWasAdded &&
    !hasBattleRoar &&
    !hasResourceHeal
  ) {
    return { ok: false, code: "no_effect", message: "Skill has no applicable effect" };
  }

  hj.mp = nextMp;
  hj.hp = curHp;
  hj.cp = curCp;
  hj.heroBuffs = sanitizeHeroBuffsForServer(newBuffs);
  return {
    ok: true,
    nextHeroJson: hj,
    logLine: hasBattleRoar ? `${meta.name}: +${battleRoarHp} HP` : `Вы использовали ${meta.name}`,
  };
}
