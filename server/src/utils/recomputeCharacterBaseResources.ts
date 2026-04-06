import fs from "node:fs";
import path from "node:path";
import {
  coerceBaseResourceTriplet,
  deriveBaseResourceColumnsFromHeroJson,
  type BaseResourceColumns,
} from "./characterBaseResources";

export type RecomputeBaseArgs = {
  level: number;
  race: string;
  classId: string;
  heroJson: Record<string, any>;
};

type RecomputeFn = (args: RecomputeBaseArgs, fallback: BaseResourceColumns) => BaseResourceColumns;

let cached: RecomputeFn | undefined;

function resolveStatsRecalcPath(): string | null {
  const candidates = [
    path.join(__dirname, "../statsRecalc.cjs"),
    path.join(__dirname, "../../dist/statsRecalc.cjs"),
    path.join(process.cwd(), "server/dist/statsRecalc.cjs"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function loadRecompute(): RecomputeFn {
  if (cached !== undefined) return cached;
  const p = resolveStatsRecalcPath();
  if (p) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const m = require(p) as { recomputeBaseResourceColumnsFromHeroSnapshot: RecomputeFn };
      if (typeof m.recomputeBaseResourceColumnsFromHeroSnapshot === "function") {
        cached = m.recomputeBaseResourceColumnsFromHeroSnapshot;
        return cached;
      }
    } catch {
      /* fall through */
    }
  }
  const fallbackFn: RecomputeFn = (args, fallback) =>
    deriveBaseResourceColumnsFromHeroJson(args.heroJson, coerceBaseResourceTriplet(fallback));
  cached = fallbackFn;
  return fallbackFn;
}

/**
 * Авторитетний перерахунок base max HP/MP/CP (рівень + екіп + пасиви, без battle бафів).
 * Якщо немає зібраного statsRecalc.cjs — fallback на derive з heroJson.baseMax* (легасі).
 */
export function recomputeBaseResourceColumnsFromHeroSnapshot(
  args: RecomputeBaseArgs,
  fallbackCols: BaseResourceColumns,
): BaseResourceColumns {
  return loadRecompute()(args, fallbackCols);
}
