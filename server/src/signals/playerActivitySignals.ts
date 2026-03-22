/**
 * Евристики поверх PlayerActivityLog — лише «сигнали» для ручної перевірки, без автобану.
 */

export type ActivityLogLite = {
  characterId: string;
  characterName: string;
  accountId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type SignalKind =
  | "rapid_sync"
  | "adena_spike"
  | "exp_spike"
  | "level_jump"
  | "regular_interval";

export type SignalDetail = {
  kind: SignalKind;
  detail: string;
  severity: "low" | "medium" | "high";
};

export type CharacterSignals = {
  characterId: string;
  characterName: string;
  accountId: string;
  signals: SignalDetail[];
};

function num(m: Record<string, unknown> | null | undefined, k: string): number {
  const v = m?.[k];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type SignalThresholds = {
  lookbackHours: number;
  maxSyncPerHour: number;
  adenaDeltaThreshold: number;
  expDeltaThreshold: number;
  minIntervalsForRegularity: number;
  maxCvForRegularity: number;
  minMeanMs: number;
  maxMeanMs: number;
};

export function getSignalThresholdsFromEnv(lookbackHours: number): SignalThresholds {
  return {
    lookbackHours,
    maxSyncPerHour: Number(process.env.ADMIN_SIGNAL_MAX_SYNC_PER_HOUR || "35"),
    adenaDeltaThreshold: Number(process.env.ADMIN_SIGNAL_ADENA_DELTA || String(50_000_000)),
    expDeltaThreshold: Number(process.env.ADMIN_SIGNAL_EXP_DELTA || String(10_000_000)),
    minIntervalsForRegularity: Number(process.env.ADMIN_SIGNAL_REGULAR_MIN_INTERVALS || "5"),
    maxCvForRegularity: Number(process.env.ADMIN_SIGNAL_REGULAR_MAX_CV || "0.07"),
    minMeanMs: Number(process.env.ADMIN_SIGNAL_REGULAR_MIN_MS || "2500"),
    maxMeanMs: Number(process.env.ADMIN_SIGNAL_REGULAR_MAX_MS || String(300_000)),
  };
}

export function analyzePlayerActivitySignals(
  logs: ActivityLogLite[],
  opts: SignalThresholds
): CharacterSignals[] {
  const hours = Math.max(opts.lookbackHours, 0.01);
  const maxSyncTotal = Math.max(1, opts.maxSyncPerHour * hours);

  const byChar = new Map<string, ActivityLogLite[]>();
  for (const r of logs) {
    const arr = byChar.get(r.characterId) ?? [];
    arr.push(r);
    byChar.set(r.characterId, arr);
  }

  const out: CharacterSignals[] = [];

  for (const [characterId, rows] of byChar) {
    const signals: SignalDetail[] = [];
    const syncRows = rows
      .filter((r) => r.action === "character.sync")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (syncRows.length > maxSyncTotal) {
      signals.push({
        kind: "rapid_sync",
        detail: `character.sync: ${syncRows.length} за ${opts.lookbackHours}г (поріг ≈${Math.floor(maxSyncTotal)})`,
        severity: syncRows.length > maxSyncTotal * 2 ? "high" : "medium",
      });
    }

    let maxAdena = 0;
    let maxExp = 0;
    let maxLevelJump = 0;
    for (const r of syncRows) {
      const m = (r.metadata || {}) as Record<string, unknown>;
      maxAdena = Math.max(maxAdena, Math.abs(num(m, "adenaDelta")));
      maxExp = Math.max(maxExp, Math.abs(num(m, "expDelta")));
      maxLevelJump = Math.max(maxLevelJump, num(m, "levelDelta"));
    }
    if (maxAdena >= opts.adenaDeltaThreshold) {
      signals.push({
        kind: "adena_spike",
        detail: `макс. |Δadena| за синк: ${maxAdena.toLocaleString("uk-UA")} (поріг ${opts.adenaDeltaThreshold.toLocaleString("uk-UA")})`,
        severity: maxAdena >= opts.adenaDeltaThreshold * 5 ? "high" : "medium",
      });
    }
    if (maxExp >= opts.expDeltaThreshold) {
      signals.push({
        kind: "exp_spike",
        detail: `макс. |Δexp| за синк: ${maxExp.toLocaleString("uk-UA")} (поріг ${opts.expDeltaThreshold.toLocaleString("uk-UA")})`,
        severity: maxExp >= opts.expDeltaThreshold * 5 ? "high" : "medium",
      });
    }
    if (maxLevelJump >= 2) {
      signals.push({
        kind: "level_jump",
        detail: `за один синк levelDelta=${maxLevelJump}`,
        severity: maxLevelJump >= 5 ? "high" : "medium",
      });
    }

    const mobSyncs = syncRows.filter((r) => {
      const m = (r.metadata || {}) as Record<string, unknown>;
      return num(m, "mobsKilledDelta") > 0;
    });
    const times = mobSyncs.map((r) => r.createdAt.getTime());
    if (times.length >= opts.minIntervalsForRegularity + 1) {
      const gaps: number[] = [];
      for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
      if (gaps.length >= opts.minIntervalsForRegularity) {
        const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length;
        const std = Math.sqrt(variance);
        const cv = mean > 0 ? std / mean : 999;
        if (mean >= opts.minMeanMs && mean <= opts.maxMeanMs && cv <= opts.maxCvForRegularity) {
          signals.push({
            kind: "regular_interval",
            detail: `інтервали між синками з +mobsKilled: n=${gaps.length}, середнє ${(mean / 1000).toFixed(1)}с, cv=${cv.toFixed(3)} (дуже рівні інтервали)`,
            severity: cv < 0.03 ? "high" : "medium",
          });
        }
      }
    }

    if (signals.length) {
      const last = rows[rows.length - 1];
      out.push({
        characterId,
        characterName: last?.characterName ?? "?",
        accountId: last?.accountId ?? "?",
        signals,
      });
    }
  }

  return out.sort((a, b) => b.signals.length - a.signals.length);
}
