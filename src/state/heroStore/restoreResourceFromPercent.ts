const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type RestoreArgs = {
  percentRaw: any;
  fullFlag: boolean;
  savedValueRaw: any;
  savedMaxRaw: any;
  finalMax: number;
  isDead: boolean;
};

export function restoreFromPercentOrFallback({
  percentRaw,
  fullFlag,
  savedValueRaw,
  savedMaxRaw,
  finalMax,
  isDead,
}: RestoreArgs): number {
  const finalMaxSafe = Math.max(1, Number(finalMax) || 1);

  const percentNum = Number(percentRaw);
  const hasPercent = Number.isFinite(percentNum);

  const savedValue = Number(savedValueRaw);
  const savedMax = Number(savedMaxRaw);

  if (hasPercent) {
    const p = clamp01(percentNum);

    if (p === 0 && !isDead) {
      if (Number.isFinite(savedValue) && Number.isFinite(savedMax) && savedMax > 0 && savedValue > 0) {
        const legacyP = clamp01(savedValue / savedMax);
        return Math.min(finalMaxSafe, Math.round(legacyP * finalMaxSafe));
      }
      return fullFlag ? finalMaxSafe : Math.min(finalMaxSafe, Math.max(1, Math.round(0.9 * finalMaxSafe)));
    }

    return Math.min(finalMaxSafe, Math.max(0, Math.round(p * finalMaxSafe)));
  }

  if (fullFlag) return finalMaxSafe;

  if (Number.isFinite(savedValue) && savedValue > 0) {
    return Math.min(finalMaxSafe, Math.max(0, Math.round(savedValue)));
  }

  return finalMaxSafe;
}
