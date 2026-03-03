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

  if (isDead) return 0;

  if (hasPercent) {
    const p = clamp01(percentNum);
    if (p > 0) return Math.min(finalMaxSafe, Math.max(0, Math.round(p * finalMaxSafe)));
  }

  // percent === 0 для живого — invalid/legacy, ігноруємо; fallback нижче

  // 🔥 КРИТИЧНО: якщо savedValue валідний і менший за max — НЕ довіряти fullFlag (може бути застарілим)
  if (Number.isFinite(savedValue) && savedValue > 0 && savedValue < finalMaxSafe) {
    return Math.min(finalMaxSafe, Math.max(0, Math.round(savedValue)));
  }

  if (fullFlag) return finalMaxSafe;

  return finalMaxSafe;
}
