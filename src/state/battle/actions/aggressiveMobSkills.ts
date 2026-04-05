import type { Mob } from "../../../data/world/types";
import type { BattleBuff } from "../types";
import { isChampionMob } from "../../../utils/mobs/isChampionMob";
import { displayMobName } from "../../../utils/worldDisplay";

const SKILL_TRY_CHANCE = 0.34;

const STACK_PDEF = "MOB_AGG_PDEF_SHRED";
const STACK_MDEF = "MOB_AGG_MDEF_SHRED";
const STACK_BLEED = "MOB_AGG_BLEED";
const STACK_STUN = "MOB_AGG_STUN";

const ICON_PDEF = "/dopskills/skill4437.png";
const ICON_MDEF = "/dopskills/skill4430.png";
const ICON_BLEED = "/dopskills/skill4268.png";
const ICON_STUN = "/dopskills/skill1536.png";

const BUFF_DURATION_MS = 12_000;
const BLEED_DURATION_MS = 5000;
const STUN_MS = 3000;

function upsertByStackType(buffs: BattleBuff[], incoming: BattleBuff): BattleBuff[] {
  const st = incoming.stackType;
  if (!st) return [...buffs, incoming];
  return [...buffs.filter((b) => b.stackType !== st), incoming];
}

/** Чи цей тип мобів використовує «скили» (не РБ): чемпіон або агро-група */
export function mobUsesAggressiveSkillPool(mob: Mob, isRaidBoss: boolean): boolean {
  if (isRaidBoss) return false;
  return isChampionMob(mob) || !!mob.aggressiveGroup;
}

/**
 * Після промаху моба по герою: шанс дебафа/стану/кровотечі.
 * РБ не викликати.
 */
export function rollAggressiveMobSkills(
  mob: Mob,
  now: number,
  heroBuffs: BattleBuff[],
  isRaidBoss: boolean
): { buffs: BattleBuff[]; heroStunnedUntil?: number; logLines: string[] } {
  if (!mobUsesAggressiveSkillPool(mob, isRaidBoss)) {
    return { buffs: heroBuffs, logLines: [] };
  }
  if (Math.random() > SKILL_TRY_CHANCE) {
    return { buffs: heroBuffs, logLines: [] };
  }

  const label = displayMobName(mob.name);
  const r = Math.random();
  let buffs = heroBuffs;
  const logLines: string[] = [];
  let heroStunnedUntil: number | undefined;

  if (r < 0.233) {
    const b: BattleBuff = {
      id: -91001,
      name: "Поріз броні",
      icon: ICON_PDEF,
      stackType: STACK_PDEF,
      effects: [{ stat: "pDef", mode: "percent", value: -20 }],
      expiresAt: now + BUFF_DURATION_MS,
      startedAt: now,
      durationMs: BUFF_DURATION_MS,
      source: "mob_skill",
    };
    buffs = upsertByStackType(buffs, b);
    logLines.push(`[${label}] накладає на вас [${b.name}].`);
  } else if (r < 0.466) {
    const b: BattleBuff = {
      id: -91002,
      name: "Розклад магії",
      icon: ICON_MDEF,
      stackType: STACK_MDEF,
      effects: [{ stat: "mDef", mode: "percent", value: -20 }],
      expiresAt: now + BUFF_DURATION_MS,
      startedAt: now,
      durationMs: BUFF_DURATION_MS,
      source: "mob_skill",
    };
    buffs = upsertByStackType(buffs, b);
    logLines.push(`[${label}] накладає на вас [${b.name}].`);
  } else if (r < 0.699) {
    const b: BattleBuff = {
      id: -91003,
      name: "Кровотеча",
      icon: ICON_BLEED,
      stackType: STACK_BLEED,
      effects: [],
      expiresAt: now + BLEED_DURATION_MS,
      startedAt: now,
      durationMs: BLEED_DURATION_MS,
      source: "mob_skill",
      tickInterval: 1,
      lastTickAt: now,
      bleedPercentMaxHp: 15,
    };
    buffs = upsertByStackType(buffs, b);
    logLines.push(`[${label}] накладає на вас [${b.name}].`);
  } else {
    heroStunnedUntil = now + STUN_MS;
    const stunBuff: BattleBuff = {
      id: -91004,
      name: "Оглушення",
      icon: ICON_STUN,
      stackType: STACK_STUN,
      effects: [],
      expiresAt: now + STUN_MS,
      startedAt: now,
      durationMs: STUN_MS,
      source: "mob_skill",
    };
    buffs = upsertByStackType(buffs, stunBuff);
    logLines.push(`[${label}] накладає на вас [${stunBuff.name}].`);
  }

  return { buffs, heroStunnedUntil, logLines };
}

/** Тики кровотечі від моба (раз на regenTick, ~1 с) */
export function processMobBleedTicks(
  buffs: BattleBuff[],
  now: number,
  maxHp: number
): { buffs: BattleBuff[]; hpLoss: number; messages: string[] } {
  let hpLoss = 0;
  const messages: string[] = [];
  const out: BattleBuff[] = [];

  for (const buff of buffs) {
    const pct = buff.bleedPercentMaxHp;
    if (pct == null || pct <= 0 || buff.stackType !== STACK_BLEED) {
      out.push(buff);
      continue;
    }
    const tickMs = Math.max(250, (buff.tickInterval ?? 1) * 1000);
    const last = buff.lastTickAt ?? buff.startedAt ?? now;
    const elapsed = now - last;
    if (elapsed < tickMs) {
      out.push(buff);
      continue;
    }
    const ticks = Math.floor(elapsed / tickMs);
    const dmgPer = Math.max(1, Math.round(maxHp * (pct / 100)));
    const totalDmg = dmgPer * ticks;
    hpLoss += totalDmg;
    messages.push(`Кровотеча: ${totalDmg} урона.`);
    out.push({
      ...buff,
      lastTickAt: last + tickMs * ticks,
    });
  }

  return { buffs: out, hpLoss, messages };
}
