import { prisma } from "../db";
import { sendAdminAlertEmail, isAdminAlertEmailConfigured } from "../adminAlertMail";
import { isInGameSignalLetterConfigured, sendAdminSignalsInGameLetter } from "../adminSignalInGameLetter";
import {
  analyzePlayerActivitySignals,
  getSignalThresholdsFromEnv,
  type ActivityLogLite,
  type CharacterSignals,
  type SignalKind,
} from "../signals/playerActivitySignals";

const MAX_LOG_ROWS = 20_000;

function logSnippetForNotify(
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
): Promise<{
  findings: number;
  notified: boolean;
  viaLetter?: boolean;
  viaEmail?: boolean;
  skippedReason?: string;
}> {
  if (process.env.ADMIN_SIGNAL_NOTIFY_DISABLED === "1" || process.env.ADMIN_SIGNAL_NOTIFY_DISABLED === "true") {
    return { findings: 0, notified: false, skippedReason: "ADMIN_SIGNAL_NOTIFY_DISABLED" };
  }

  const skipExternalEmail =
    process.env.ADMIN_SIGNAL_EMAIL_ENABLED === "0" || process.env.ADMIN_SIGNAL_EMAIL_ENABLED === "false";

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
    return { findings: 0, notified: false };
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
    log(`[AdminSignal] ${findings.length} знахідок, усі типи в cooldown сповіщень (${cooldownHours}г)`);
    return { findings: findings.length, notified: false, skippedReason: "cooldown" };
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
  lines.push(`[Адмін / сигнали] Вікно: останні ${lookbackHours} год.`);
  lines.push(`Рядків у логах (до ${MAX_LOG_ROWS}): ${raw.length}`);
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
    lines.push(logSnippetForNotify(recent));
    lines.push("");
  }

  const subject = `Сигнали: ${toNotify.length} персонаж(ів) — перевір у адмінці`;
  const body = lines.join("\n");

  let viaLetter = false;
  if (isInGameSignalLetterConfigured()) {
    try {
      viaLetter = await sendAdminSignalsInGameLetter(subject, body, log);
    } catch (e) {
      log(`[AdminSignal] Помилка ігрового листа`, { err: String(e) });
    }
  }

  let viaEmail = false;
  if (!viaLetter && !skipExternalEmail && isAdminAlertEmailConfigured()) {
    try {
      viaEmail = await sendAdminAlertEmail(`[text-rpg] ${subject}`, body);
    } catch (e) {
      log(`[AdminSignal] Помилка email`, { err: String(e) });
    }
  }

  if (!viaLetter && !viaEmail) {
    if (!isInGameSignalLetterConfigured() && (!isAdminAlertEmailConfigured() || skipExternalEmail)) {
      log(
        `[AdminSignal] ${findings.length} знахідок — задайте ігрову пошту: ADMIN_SIGNAL_LETTER_TO_NAME=НікПерсонажа (або SMTP, якщо потрібен email)`
      );
    }
    return {
      findings: findings.length,
      notified: false,
      skippedReason: "no_channel_or_send_failed",
    };
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

  if (viaLetter) log(`[AdminSignal] Сповіщення відправлено ігровою поштою`);
  if (viaEmail) log(`[AdminSignal] Сповіщення відправлено на email`);

  return { findings: findings.length, notified: true, viaLetter, viaEmail };
}
