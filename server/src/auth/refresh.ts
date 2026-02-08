/**
 * Refresh token cookie (httpOnly). Env: COOKIE_SECURE, COOKIE_DOMAIN, REFRESH_TTL_DAYS.
 * For production: COOKIE_SECURE=true, COOKIE_DOMAIN=your-domain.com
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

export function setRefreshCookie(reply: FastifyReply, token: string) {
  const secure = process.env.COOKIE_SECURE === "true";
  const domain = process.env.COOKIE_DOMAIN || undefined;

  reply.setCookie("refresh_token", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/auth/refresh",
    domain,
    maxAge: Number(process.env.REFRESH_TTL_DAYS || "30") * 24 * 60 * 60,
  });
}

export function clearRefreshCookie(reply: FastifyReply) {
  const secure = process.env.COOKIE_SECURE === "true";
  const domain = process.env.COOKIE_DOMAIN || undefined;

  reply.clearCookie("refresh_token", {
    path: "/auth/refresh",
    domain,
    secure,
    sameSite: "lax",
  });
}

export function getRefreshCookie(req: FastifyRequest) {
  return (req.cookies as { refresh_token?: string } | undefined)?.refresh_token;
}
