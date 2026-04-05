function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** MP після lsGuidance та mpSkillCostReduction (як у client useSkill). */
export function effectiveSkillMpCost(rawMp: number, heroCombatStats: Record<string, number> | undefined): number {
  const raw = Math.max(0, Math.floor(Number(rawMp) || 0));
  if (raw <= 0) return 0;
  const lsGuidance = clamp(Number(heroCombatStats?.lsGuidance ?? 0), 0, 50);
  const mpSkillRed = clamp(Number(heroCombatStats?.mpSkillCostReduction ?? 0), 0, 90);
  return Math.max(0, Math.round(raw * (1 - lsGuidance / 100) * (1 - mpSkillRed / 100)));
}

/** RSK Focus: шанс не витратити MP (attackSkill). */
export function rollMpSpend(mpCost: number, heroCombatStats: Record<string, number> | undefined): number {
  if (mpCost <= 0) return 0;
  const f = clamp(Number(heroCombatStats?.lsRskFocus ?? 0), 0, 100);
  if (f > 0 && Math.random() * 100 < f) return 0;
  return mpCost;
}
