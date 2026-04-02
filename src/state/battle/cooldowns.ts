// Centralized cooldown calculation logic so we can reuse it for skills, items, sets, etc.
// Applies hero cooldown reduction (capped to 50%) + LS Focus, enforces a minimal multiplier and floor.

/** Множник тривалості КД (1.0 = без зменшення) — для фізичних скілів після формули attackSpeed. */
export function getSkillCooldownMultiplier(heroStats: any): number {
  const rawCd = Number(heroStats?.cooldownReduction ?? 0);
  const lsFocus = Number(heroStats?.lsFocus ?? 0);
  const cdReduction = Math.max(0, Math.min(50, Number.isFinite(rawCd) ? rawCd : 0) + lsFocus);
  const cdMultiplier = 1 - Math.min(75, cdReduction) / 100;
  return Number.isFinite(cdMultiplier) ? Math.max(0.5, cdMultiplier) : 1;
}

export const calcCooldownMs = (heroStats: any, baseSec?: number, isToggle?: boolean): number => {
  if (isToggle) return 0;

  const rawCd = Number(heroStats?.cooldownReduction ?? 0);
  const lsFocus = Number(heroStats?.lsFocus ?? 0);
  const cdReduction = Math.max(0, Math.min(50, Number.isFinite(rawCd) ? rawCd : 0) + lsFocus);
  const cdMultiplier = 1 - Math.min(75, cdReduction) / 100;

  const base = typeof baseSec === "number" ? baseSec : 5;
  const effectiveMultiplier = Number.isFinite(cdMultiplier) ? Math.max(0.5, cdMultiplier) : 1;

  return Math.max(300, Math.round(base * 1000 * effectiveMultiplier));
};
