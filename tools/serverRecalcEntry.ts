/**
 * Єдина точка для esbuild → server/dist/statsRecalc.cjs
 * (серверний tsc не може імпортувати кореневий src/ через rootDir).
 */
import { recalculateAllStats } from "../src/utils/stats/recalculateAllStats";

const MAX_BASE_RESOURCE = 5_000_000;

function coerceBaseResourceTriplet(raw: Partial<{ baseMaxHp: number; baseMaxMp: number; baseMaxCp: number }>) {
  const one = (n: unknown, fallback: number) => {
    const x = Math.floor(Number(n));
    if (!Number.isFinite(x) || x < 1) return Math.max(1, Math.min(MAX_BASE_RESOURCE, fallback));
    return Math.min(MAX_BASE_RESOURCE, Math.max(1, x));
  };
  return {
    baseMaxHp: one(raw?.baseMaxHp, 1),
    baseMaxMp: one(raw?.baseMaxMp, 1),
    baseMaxCp: one(raw?.baseMaxCp, 1),
  };
}

export function recomputeBaseResourceColumnsFromHeroSnapshot(
  args: {
    level: number;
    race: string;
    classId: string;
    heroJson: Record<string, any>;
  },
  fallbackCols: { baseMaxHp: number; baseMaxMp: number; baseMaxCp: number },
): { baseMaxHp: number; baseMaxMp: number; baseMaxCp: number } {
  const hjRaw = args.heroJson && typeof args.heroJson === "object" ? args.heroJson : {};
  const hj = { ...hjRaw };
  const hero: Record<string, unknown> = {
    ...hj,
    level: Math.max(1, Math.floor(Number(args.level ?? hj.level ?? 1))),
    race: (hj.race as string) || args.race,
    klass: (hj.klass as string) || (hj.classId as string) || args.classId,
    classId: args.classId,
    heroBuffs: [],
    hp: undefined,
    mp: undefined,
    cp: undefined,
    baseMaxHp: 999_999,
    maxHp: 999_999,
    baseMaxMp: 999_999,
    maxMp: 999_999,
    baseMaxCp: 999_999,
    maxCp: 999_999,
  };
  delete hero.battleStats;
  delete hero.heroJson;

  try {
    const rec = recalculateAllStats(hero as any, []);
    return coerceBaseResourceTriplet({
      baseMaxHp: rec.resources.maxHp,
      baseMaxMp: rec.resources.maxMp,
      baseMaxCp: rec.resources.maxCp,
    });
  } catch {
    return coerceBaseResourceTriplet(fallbackCols);
  }
}
