import { prisma } from "../db";
import { sendAdminAlertEmail, isAdminAlertEmailConfigured } from "../adminAlertMail";
import {
  analyzePlayerActivitySignals,
  getSignalThresholdsFromEnv,
  type ActivityLogLite,
  type CharacterSignals,
  type SignalKind,
} from "../signals/playerActivitySignals";

const MAX_LOG_ROWS = 20_000;

function logSnippetForEmail(
  rows: { createdAt: Date; action: string; metadata: unknown; clientIp: string | null }[]
): string {
  return rows
    .map((r) => {
      const meta =
        typeof r.metadata === "object" && r.metadata !== null
          ? JSON.stringify(r.metadata)
          : String(r.metadata ?? "");
      const short = meta.length > 220 ? `${meta.slice(0, 220)}…` : meta;
      return `${r.createdAt.toISOString()}\t${r.action}\t${r.clientIp ?? "—"}\t${short}`;
    })
    .join("\n");
}

export async function runAdminSignalEmailJob(
  log: (msg: string, meta?: object) => void
): Promise<{ findings: number; emailed: boolean; skippedReason?: string }> {
  if (process.env.ADMIN_SIGNAL_EMAIL_ENABLED === "0" || process.env.ADMIN_SIGNAL_EMAIL_ENABLED === "false") {
    return { findings: 0, emailed: false, skippedReason: "ADMIN_SIGNAL_EMAIL_ENABLED=0" };
  }

  const lookbackHours = Math.min(72, Math.max(1, Number(process.env.ADMIN_SIGNAL_LOOKBACK_HOURS || "6")));
  const cooldownHours = Math.max(1, Number(process.env.ADMIN_SIGNAL_EMAIL_COOLDOWN_HOURS || "6"));
  const cooldownMs = cooldownHours * 3600000;
  const now = Date.now();

  const since = new Date(now - lookbackHours * 3600000);
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

  const thresholds = getSignalThresholdsFromEnv(lookbackHours);
  const findings = analyzePlayerActivitySignals(logs, thresholds);

  if (findings.length === 0) {
    return { findings: 0, emailed: false };
  }

  if (!isAdminAlertEmailConfigured()) {
    log(`[AdminSignal] ${findings.length} знахідок, email не налаштовано (ADMIN_ALERT_SMTP_*, ADMIN_ALERT_EMAIL_TO)`);
    return { findings: findings.length, emailed: false, skippedReason: "smtp_not_configured" };
  }

  type Notify = { finding: CharacterSignals; kinds: SignalKind[] };
  const toNotify: Notify[] = [];

  for (const f of findings) {
    const freshKinds: SignalKind[] = [];
    for (const s of f.signals) {
      const row = await prisma.adminSignalEmailSent.findUnique({
        where: {
          characterId_signalType: { characterId: f.characterId, signalType: s.kind },
        },
      });
      if (!row || now - row.lastSentAt.getTime() > cooldownMs) {
        freshKinds.push(s.kind);
      }
    }
    if (freshKinds.length) toNotify.push({ finding: f, kinds: freshKinds });
  }

  if (toNotify.length === 0) {
    log(`[AdminSignal] ${findings.length} знахідок, усі типи в cooldown email (${cooldownHours}г)`);
    return { findings: findings.length, emailed: false, skippedReason: "cooldown" };
  }

  const charIds = [...new Set(toNotify.map((n) => n.finding.characterId))];
  const recentAll = await prisma.playerActivityLog.findMany({
    where: { characterId: { in: charIds }, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: { characterId: true, createdAt: true, action: true, metadata: true, clientIp: true },
  });
  const byChar = new Map<string, typeof recentAll>();
  for (const r of recentAll) {
    const arr = byChar.get(r.characterId) ?? [];
    arr.push(r);
    byChar.set(r.characterId, arr);
  }
  for (const [, arr] of byChar) {
    arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const lines: string[] = [];
  lines.push(`Вікно аналізу: останні ${lookbackHours} год.`);
  lines.push(`Рядків у логах (обрізано до ${MAX_LOG_ROWS}): ${raw.length}`);
  lines.push("");
  for (const { finding: f, kinds } of toNotify) {
    lines.push(`── ${f.characterName} (${f.characterId}) account=${f.accountId} ──`);
    for (const s of f.signals) {
      if (kinds.includes(s.kind)) {
        lines.push(`  [${s.severity}] ${s.kind}: ${s.detail}`);
      }
    }
    const recent = (byChar.get(f.characterId) ?? []).slice(0, 35);
    lines.push("  Останні події:");
    lines.push(logSnippetForEmail(recent));
    lines.push("");
  }

  const subject = `[text-rpg] Сигнали: ${toNotify.length} персонаж(ів) (потрібна перевірка)`;
  const body = lines.join("\n");

  try {
    const ok = await sendAdminAlertEmail(subject, body);
    if (!ok) {
      return { findings: findings.length, emailed: false, skippedReason: "send_failed" };
    }
    for (const { finding: f, kinds } of toNotify) {
      for (const k of kinds) {
        await prisma.adminSignalEmailSent.upsert({
          where: {
            characterId_signalType: { characterId: f.characterId, signalType: k },
          },
          create: { characterId: f.characterId, signalType: k, lastSentAt: new Date() },
          update: { lastSentAt: new Date() },
        });
      }
    }
    log(`[AdminSignal] Email відправлено: ${toNotify.length} персонаж(ів)`);
    return { findings: findings.length, emailed: true };
  } catch (e) {
    log(`[AdminSignal] Помилка відправки email`, { err: String(e) });
    return { findings: findings.length, emailed: false, skippedReason: String(e) };
  }
}
