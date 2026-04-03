/**
 * GM скроли «Bless the Soul» — одна іконка, різні ефекти (тимчасові бафи в бою).
 */
import type { BattleBuff } from "../../state/battle/types";

export const GM_BLESS_SOUL_SCROLL_ICON = "/items/drops/resources/Br_cash_scroll_of_bless_the_soul_i00_0.jpg";

/** Тривалість бафа (хв) */
export const GM_BLESS_SOUL_SCROLL_DURATION_MIN = 20;
export const GM_BLESS_SOUL_SCROLL_DURATION_MS = GM_BLESS_SOUL_SCROLL_DURATION_MIN * 60 * 1000;

const ID = {
  might: -971001,
  haste: -971002,
  focus: -971003,
  death_whisper: -971004,
  guidance: -971005,
  vampiric_rage: -971006,
  empower: -971007,
  acumen: -971008,
  wild_magic: -971009,
  concentration: -971010,
  shield: -971011,
  magic_barrier: -971012,
  wind_walk: -971013,
  agility: -971014,
  blessed_body: -971015,
  blessed_soul: -971016,
  regeneration: -971017,
  clarity: -971018,
} as const;

type Effect = { stat: string; mode: "percent" | "flat" | "multiplier"; value: number };

const SCROLL_EFFECTS: Record<string, { buffId: number; buffName: string; effects: Effect[] }> = {
  gm_bless_scroll_might: {
    buffId: ID.might,
    buffName: "Might (скрол)",
    effects: [{ stat: "pAtk", mode: "percent", value: 15 }],
  },
  gm_bless_scroll_haste: {
    buffId: ID.haste,
    buffName: "Haste (скрол)",
    effects: [{ stat: "atkSpeed", mode: "percent", value: 15 }],
  },
  gm_bless_scroll_focus: {
    buffId: ID.focus,
    buffName: "Focus (скрол)",
    effects: [{ stat: "crit", mode: "percent", value: 25 }],
  },
  gm_bless_scroll_death_whisper: {
    buffId: ID.death_whisper,
    buffName: "Death Whisper (скрол)",
    effects: [{ stat: "critPower", mode: "percent", value: 35 }],
  },
  gm_bless_scroll_guidance: {
    buffId: ID.guidance,
    buffName: "Guidance (скрол)",
    effects: [{ stat: "accuracy", mode: "flat", value: 4 }],
  },
  /** Лише ближній бій (без лука): див. baseAttack / handleAttackSkill */
  gm_bless_scroll_vampiric_rage: {
    buffId: ID.vampiric_rage,
    buffName: "Vampiric Rage (скрол)",
    effects: [{ stat: "vampirismMelee", mode: "flat", value: 6 }],
  },
  gm_bless_scroll_empower: {
    buffId: ID.empower,
    buffName: "Empower (скрол)",
    effects: [{ stat: "mAtk", mode: "percent", value: 75 }],
  },
  gm_bless_scroll_acumen: {
    buffId: ID.acumen,
    buffName: "Acumen (скрол)",
    effects: [{ stat: "castSpeed", mode: "percent", value: 30 }],
  },
  /** Множник до базового шансу маг. криту */
  gm_bless_scroll_wild_magic: {
    buffId: ID.wild_magic,
    buffName: "Wild Magic (скрол)",
    effects: [{ stat: "mCrit", mode: "multiplier", value: 3 }],
  },
  /** Зменшення шансу переривання касту (зарезервовано; стат у бафах для майбутньої логіки мобів) */
  gm_bless_scroll_concentration: {
    buffId: ID.concentration,
    buffName: "Concentration (скрол)",
    effects: [{ stat: "castInterruptResist", mode: "flat", value: 18 }],
  },
  gm_bless_scroll_shield: {
    buffId: ID.shield,
    buffName: "Shield (скрол)",
    effects: [{ stat: "pDef", mode: "percent", value: 15 }],
  },
  gm_bless_scroll_magic_barrier: {
    buffId: ID.magic_barrier,
    buffName: "Magic Barrier (скрол)",
    effects: [{ stat: "mDef", mode: "percent", value: 30 }],
  },
  gm_bless_scroll_wind_walk: {
    buffId: ID.wind_walk,
    buffName: "Wind Walk (скрол)",
    effects: [{ stat: "runSpeed", mode: "flat", value: 20 }],
  },
  gm_bless_scroll_agility: {
    buffId: ID.agility,
    buffName: "Agility (скрол)",
    effects: [{ stat: "evasion", mode: "flat", value: 4 }],
  },
  gm_bless_scroll_blessed_body: {
    buffId: ID.blessed_body,
    buffName: "Blessed Body (скрол)",
    effects: [{ stat: "maxHp", mode: "percent", value: 25 }],
  },
  gm_bless_scroll_blessed_soul: {
    buffId: ID.blessed_soul,
    buffName: "Blessed Soul (скрол)",
    effects: [{ stat: "maxMp", mode: "percent", value: 25 }],
  },
  gm_bless_scroll_regeneration: {
    buffId: ID.regeneration,
    buffName: "Regeneration (скрол)",
    effects: [{ stat: "hpRegen", mode: "percent", value: 20 }],
  },
  gm_bless_scroll_clarity: {
    buffId: ID.clarity,
    buffName: "Clarity (скрол)",
    effects: [{ stat: "mpSkillCostReduction", mode: "flat", value: 10 }],
  },
};

/** Порядок у GM-шопі: фіз → маг → захист → реген */
export const GM_BLESS_SOUL_SCROLL_IDS = [
  "gm_bless_scroll_might",
  "gm_bless_scroll_haste",
  "gm_bless_scroll_focus",
  "gm_bless_scroll_death_whisper",
  "gm_bless_scroll_guidance",
  "gm_bless_scroll_vampiric_rage",
  "gm_bless_scroll_empower",
  "gm_bless_scroll_acumen",
  "gm_bless_scroll_wild_magic",
  "gm_bless_scroll_concentration",
  "gm_bless_scroll_shield",
  "gm_bless_scroll_magic_barrier",
  "gm_bless_scroll_wind_walk",
  "gm_bless_scroll_agility",
  "gm_bless_scroll_blessed_body",
  "gm_bless_scroll_blessed_soul",
  "gm_bless_scroll_regeneration",
  "gm_bless_scroll_clarity",
] as const;

export function isGmBlessSoulScrollItem(itemId: string): boolean {
  return itemId in SCROLL_EFFECTS;
}

export function createGmBlessSoulScrollBuff(itemId: string, now: number): BattleBuff | null {
  const def = SCROLL_EFFECTS[itemId];
  if (!def) return null;
  return {
    id: def.buffId,
    name: def.buffName,
    icon: GM_BLESS_SOUL_SCROLL_ICON,
    source: "gm_bless_scroll",
    buffGroup: "GM_BLESS_SCROLL",
    effects: def.effects.map((e) => ({ ...e })),
    expiresAt: now + GM_BLESS_SOUL_SCROLL_DURATION_MS,
    startedAt: now,
    durationMs: GM_BLESS_SOUL_SCROLL_DURATION_MS,
  };
}
