/**
 * GM Bless Soul Scroll buff definitions (server-side mirror of client's gmBlessSoulScrollBuffs.ts).
 * Used by POST /characters/:id/use-buff-scroll to atomically apply buffs without client race conditions.
 */

export const GM_BLESS_SCROLL_DURATION_MS = 20 * 60 * 1000; // 20 хв

export const GM_BLESS_SCROLL_EFFECTS: Record<string, { buffId: number; buffName: string; effects: any[] }> = {
  gm_bless_scroll_might:          { buffId: -971001, buffName: "Might (скрол)",           effects: [{ stat: "pAtk",                  mode: "percent",    value: 15  }] },
  gm_bless_scroll_haste:          { buffId: -971002, buffName: "Haste (скрол)",            effects: [{ stat: "atkSpeed",              mode: "percent",    value: 15  }] },
  gm_bless_scroll_focus:          { buffId: -971003, buffName: "Focus (скрол)",            effects: [{ stat: "crit",                  mode: "percent",    value: 25  }] },
  gm_bless_scroll_death_whisper:  { buffId: -971004, buffName: "Death Whisper (скрол)",   effects: [{ stat: "critPower",             mode: "percent",    value: 35  }] },
  gm_bless_scroll_guidance:       { buffId: -971005, buffName: "Guidance (скрол)",         effects: [{ stat: "accuracy",              mode: "flat",       value: 4   }] },
  gm_bless_scroll_vampiric_rage:  { buffId: -971006, buffName: "Vampiric Rage (скрол)",   effects: [{ stat: "vampirismMelee",        mode: "flat",       value: 6   }] },
  gm_bless_scroll_empower:        { buffId: -971007, buffName: "Empower (скрол)",          effects: [{ stat: "mAtk",                  mode: "percent",    value: 75  }] },
  gm_bless_scroll_acumen:         { buffId: -971008, buffName: "Acumen (скрол)",           effects: [{ stat: "castSpeed",             mode: "percent",    value: 30  }] },
  gm_bless_scroll_wild_magic:     { buffId: -971009, buffName: "Wild Magic (скрол)",       effects: [{ stat: "mCrit",                 mode: "multiplier", value: 3   }] },
  gm_bless_scroll_concentration:  { buffId: -971010, buffName: "Concentration (скрол)",   effects: [{ stat: "castInterruptResist",   mode: "flat",       value: 18  }] },
  gm_bless_scroll_shield:         { buffId: -971011, buffName: "Shield (скрол)",           effects: [{ stat: "pDef",                  mode: "percent",    value: 15  }] },
  gm_bless_scroll_magic_barrier:  { buffId: -971012, buffName: "Magic Barrier (скрол)",   effects: [{ stat: "mDef",                  mode: "percent",    value: 30  }] },
  gm_bless_scroll_wind_walk:      { buffId: -971013, buffName: "Wind Walk (скрол)",        effects: [{ stat: "runSpeed",              mode: "flat",       value: 20  }] },
  gm_bless_scroll_agility:        { buffId: -971014, buffName: "Agility (скрол)",          effects: [{ stat: "evasion",               mode: "flat",       value: 4   }] },
  gm_bless_scroll_blessed_body:   { buffId: -971015, buffName: "Blessed Body (скрол)",    effects: [{ stat: "maxHp",                 mode: "percent",    value: 25  }] },
  gm_bless_scroll_blessed_soul:   { buffId: -971016, buffName: "Blessed Soul (скрол)",    effects: [{ stat: "maxMp",                 mode: "percent",    value: 25  }] },
  gm_bless_scroll_regeneration:   { buffId: -971017, buffName: "Regeneration (скрол)",    effects: [{ stat: "hpRegen",               mode: "percent",    value: 20  }] },
  gm_bless_scroll_clarity:        { buffId: -971018, buffName: "Clarity (скрол)",          effects: [{ stat: "mpSkillCostReduction",  mode: "flat",       value: 10  }] },
};
