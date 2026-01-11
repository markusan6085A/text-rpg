// Centralized cooldown calculation logic so we can reuse it for skills, items, sets, etc.
// Applies hero cooldown reduction (capped to 50%) and enforces a minimal multiplier and floor.
export const calcCooldownMs = (heroStats: any, baseSec?: number, isToggle?: boolean): number => {
  if (isToggle) return 0;

  const rawCd = Number(heroStats?.cooldownReduction ?? 0);
  const cdReduction = Math.max(0, Math.min(50, Number.isFinite(rawCd) ? rawCd : 0));
  const cdMultiplier = 1 - cdReduction / 100;

  const base = typeof baseSec === "number" ? baseSec : 5;
  const effectiveMultiplier = Number.isFinite(cdMultiplier) ? Math.max(0.5, cdMultiplier) : 1;

  return Math.max(300, Math.round(base * 1000 * effectiveMultiplier));
};
