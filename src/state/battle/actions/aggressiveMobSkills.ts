import type { Mob } from "../../../data/world/types";
import type { BattleBuff } from "../types";
import { isChampionMob } from "../../../utils/mobs/isChampionMob";
import { displayMobName } from "../../../utils/worldDisplay";

const SKILL_TRY_CHANCE = 0.34;

const STACK_PDEF = "MOB_AGG_PDEF_SHRED";
const STACK_MDEF = "MOB_AGG_MDEF_SHRED";
const STACK_BLEED = "MOB_AGG_BLEED";

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
      icon: "/skills/attack.jpg",
      stackType: STACK_PDEF,
      effects: [{ stat: "pDef", mode: "percent", value: -20 }],
      expiresAt: now + BUFF_DURATION_MS,
      startedAt: now,
      durationMs: BUFF_DURATION_MS,
      source: "mob_skill",
    };
    buffs = upsertByStackType(buffs, b);
    logLines.push(`${label}: -20% фіз. захисту на ${BUFF_DURATION_MS / 1000} сек.`);
  } else if (r < 0.466) {
    const b: BattleBuff = {
      id: -91002,
      name: "Розклад магії",
      icon: "/skills/attack.jpg",
      stackType: STACK_MDEF,
      effects: [{ stat: "mDef", mode: "percent", value: -20 }],
      expiresAt: now + BUFF_DURATION_MS,
      startedAt: now,
      durationMs: BUFF_DURATION_MS,
      source: "mob_skill",
    };
    buffs = upsertByStackType(buffs, b);
    logLines.push(`${label}: -20% маг. захисту на ${BUFF_DURATION_MS / 1000} сек.`);
  } else if (r < 0.699) {
    const b: BattleBuff = {
      id: -91003,
      name: "Кровотеча",
      icon: "/skills/attack.jpg",
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
    logLines.push(`${label}: кровотеча! 15% від макс. HP щосек (5 сек).`);
  } else {
    heroStunnedUntil = now + STUN_MS;
    logLines.push(`${label}: оглушення 3 сек.`);
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
