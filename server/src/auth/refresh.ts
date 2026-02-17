/**
 * Refresh token cookie (httpOnly).
 * Env: COOKIE_SECURE, COOKIE_DOMAIN, REFRESH_TTL_DAYS, REFRESH_COOKIE_PATH, COOKIE_SAME_SITE.
 *
 * Якщо фронт на www.l2dop.com, а API на api.l2dop.com — браузер відправляє запити на www (через Vercel
 * rewrite). Відповіді з Set-Cookie приходять від того ж origin (www), тому кукі зберігається для www.
 * Якщо ж кукі було встановлено з Domain=api.l2dop.com — воно не відправляється на www → 401 після простою.
 * Рішення: на сервері api.l2dop.com поставити COOKIE_DOMAIN=.l2dop.com, path=/, SameSite=None; Secure,
 * щоб кукі ділилося між піддоменами (браузер тоді відправляє й на www, і на api).
 */
import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** Path для refresh cookie. Якщо фронт через /api — краще path=/ або REFRESH_COOKIE_PATH=/ */
const REFRESH_COOKIE_PATH = process.env.REFRESH_COOKIE_PATH || "/";

export function setRefreshCookie(reply: FastifyReply, token: string) {
  const secure = process.env.COOKIE_SECURE === "true";
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const sameSite = (process.env.COOKIE_SAME_SITE as "strict" | "lax" | "none") || "lax";

  reply.setCookie("refresh_token", token, {
    httpOnly: true,
    secure: sameSite === "none" ? true : secure,
    sameSite,
    path: REFRESH_COOKIE_PATH,
    domain,
    maxAge: Number(process.env.REFRESH_TTL_DAYS || "30") * 24 * 60 * 60,
  });
}

export function clearRefreshCookie(reply: FastifyReply) {
  const secure = process.env.COOKIE_SECURE === "true";
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const sameSite = (process.env.COOKIE_SAME_SITE as "strict" | "lax" | "none") || "lax";

  reply.clearCookie("refresh_token", {
    path: REFRESH_COOKIE_PATH,
    domain,
    secure: sameSite === "none" ? true : secure,
    sameSite,
    maxAge: 0,
  });
}

export function getRefreshCookie(req: FastifyRequest) {
  return (req.cookies as { refresh_token?: string } | undefined)?.refresh_token;
}
