import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";
import { requireAdmin } from "./adminGuard";
import {
  analyzePlayerActivitySignals,
  getSignalThresholdsFromEnv,
  type ActivityLogLite,
} from "../signals/playerActivitySignals";
import { isAdminAlertEmailConfigured } from "../adminAlertMail";

const MAX_LOG_ROWS = 20_000;

export const adminSignalsRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/signals/analyze?hours=6
  app.get("/analyze", { preHandler: [requireAdmin] }, async (req) => {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const hours = Math.min(168, Math.max(1, Number.parseInt(String(q.hours || "6"), 10) || 6));
    const since = new Date(Date.now() - hours * 3600000);

    const raw = await prisma.playerActivityLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: MAX_LOG_ROWS,
      select: {
        characterId: true,
        characterName: true,
        accountId: true,
        action: true,
        metadata: true,
        createdAt: true,
      },
    });

    const logs: ActivityLogLite[] = raw.map((r) => ({
      characterId: r.characterId,
      characterName: r.characterName,
      accountId: r.accountId,
      action: r.action,
      metadata: (r.metadata as Record<string, unknown>) ?? null,
      createdAt: r.createdAt,
    }));

    const thresholds = getSignalThresholdsFromEnv(hours);
    const findings = analyzePlayerActivitySignals(logs, thresholds);

    return {
      ok: true,
      hours,
      logRowCount: raw.length,
      logRowCap: MAX_LOG_ROWS,
      findings,
      emailConfigured: isAdminAlertEmailConfigured(),
      generatedAt: new Date().toISOString(),
      thresholds: {
        maxSyncPerHour: thresholds.maxSyncPerHour,
        adenaDeltaThreshold: thresholds.adenaDeltaThreshold,
        expDeltaThreshold: thresholds.expDeltaThreshold,
        minIntervalsForRegularity: thresholds.minIntervalsForRegularity,
        maxCvForRegularity: thresholds.maxCvForRegularity,
        minMeanMs: thresholds.minMeanMs,
        maxMeanMs: thresholds.maxMeanMs,
      },
    };
  });
};
