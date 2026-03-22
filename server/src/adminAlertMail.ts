import nodemailer from "nodemailer";

/**
 * Сповіщення адміна по SMTP. Якщо ADMIN_ALERT_SMTP_HOST або ADMIN_ALERT_EMAIL_TO не задані — тихо пропускаємо.
 */
export function isAdminAlertEmailConfigured(): boolean {
  return Boolean(process.env.ADMIN_ALERT_SMTP_HOST?.trim() && process.env.ADMIN_ALERT_EMAIL_TO?.trim());
}

export async function sendAdminAlertEmail(subject: string, text: string, html?: string): Promise<boolean> {
  const host = process.env.ADMIN_ALERT_SMTP_HOST?.trim();
  const to = process.env.ADMIN_ALERT_EMAIL_TO?.trim();
  if (!host || !to) return false;

  const port = Number(process.env.ADMIN_ALERT_SMTP_PORT || "587");
  const secure =
    process.env.ADMIN_ALERT_SMTP_SECURE === "1" || process.env.ADMIN_ALERT_SMTP_SECURE === "true";
  const user = process.env.ADMIN_ALERT_SMTP_USER?.trim() || "";
  const pass = process.env.ADMIN_ALERT_SMTP_PASS?.trim() || "";
  const from =
    process.env.ADMIN_ALERT_EMAIL_FROM?.trim() || user || "noreply@text-rpg";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html ?? `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
  });
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
