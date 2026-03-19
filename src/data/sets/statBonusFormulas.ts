/**
 * Formulas for set bonuses: converts set stat bonuses (STR, DEX, CON, INT, WIT, MEN)
 * into combat bonuses. Separate logic from base stats — same names, different calculation.
 *
 * +1 STR = +25 pAtk, +20 critPower
 * +1 DEX = +30 attackSpeed, +10 accuracy, +10 evasion, +20 crit
 * +1 CON = +250 maxHp/maxCp, +2 hpRegen, +20 mDef, +20 pDef
 * +1 INT = +10% magicSkillPower, +15 critPower, +25 mAtk
 * +1 WIT = +15 mCrit, +30 castSpeed
 * +1 MEN = +40 maxMp, +2 mpRegen
 */

export type SetStatName = "STR" | "DEX" | "CON" | "INT" | "WIT" | "MEN";

export interface SetStatBonusFormulas {
  pAtk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  accuracy?: number;
  evasion?: number;
  crit?: number;
  mCrit?: number;
  critPower?: number;
  attackSpeed?: number;
  castSpeed?: number;
  hpRegen?: number;
  mpRegen?: number;
  maxHp?: number;
  maxMp?: number;
  maxCp?: number;
  /** % bonus to magic skill damage (additive: +10 per INT point) */
  magicSkillPower?: number;
}

export const SET_STAT_BONUS_FORMULAS: Record<SetStatName, SetStatBonusFormulas> = {
  STR: { pAtk: 25, critPower: 20 },
  DEX: { attackSpeed: 30, accuracy: 10, evasion: 10, crit: 20 },
  CON: { maxHp: 250, maxCp: 250, hpRegen: 2, mDef: 20, pDef: 20 },
  INT: { magicSkillPower: 10, critPower: 15, mAtk: 25 },
  WIT: { mCrit: 15, castSpeed: 30 },
  MEN: { maxMp: 40, mpRegen: 2 },
};

/**
 * Converts set stat bonuses (e.g. { STR: 4, DEX: 2 }) into combat bonuses.
 */
export function convertSetStatsToBonuses(setStats: Partial<Record<SetStatName, number>>): SetStatBonusFormulas {
  const result: SetStatBonusFormulas = {};

  for (const [stat, value] of Object.entries(setStats)) {
    if (typeof value !== "number" || value <= 0) continue;
    const formulas = SET_STAT_BONUS_FORMULAS[stat as SetStatName];
    if (!formulas) continue;

    for (const [key, perPoint] of Object.entries(formulas)) {
      const v = (perPoint as number) * value;
      const k = key as keyof SetStatBonusFormulas;
      const curr = (result[k] as number) ?? 0;
      (result as any)[k] = curr + v;
    }
  }

  return result;
}

/**
 * Human-readable formula table for UI (Stats screen, set bonus info).
 * statColor: Tailwind class for stat label. effectsColor: for effects text.
 */
export const SET_STAT_FORMULAS_UI: Array<{ stat: string; effects: string; statColor: string; effectsColor: string }> = [
  { stat: "+1 STR", effects: "+25 физ. урон, +20 сила крита", statColor: "text-red-400", effectsColor: "text-red-300/90" },
  { stat: "+1 DEX", effects: "+30 скор. атаки, +10 точность, +10 уклонение, +20 шанс крита", statColor: "text-yellow-400", effectsColor: "text-amber-300/90" },
  { stat: "+1 CON", effects: "+250 макс. HP и CP, +2 реген. HP, +20 м. деф, +20 п. деф", statColor: "text-green-400", effectsColor: "text-emerald-300/90" },
  { stat: "+1 INT", effects: "+10% урон маг. умений, +15 сила крита, +25 маг. атака", statColor: "text-orange-400", effectsColor: "text-orange-300/90" },
  { stat: "+1 WIT", effects: "+15 шанс маг. крита, +30 скор. каста", statColor: "text-violet-400", effectsColor: "text-violet-300/90" },
  { stat: "+1 MEN", effects: "+40 макс. MP, +2 реген. MP", statColor: "text-blue-400", effectsColor: "text-sky-300/90" },
];
