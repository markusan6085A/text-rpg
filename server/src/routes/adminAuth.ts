import type { FastifyPluginAsync } from "fastify";
import { createAdminSession, deleteAdminSession } from "../adminSessions";
import { requireAdmin } from "./adminGuard";

function getAdminPasswordFromEnv(): string {
  const key = Object.keys(process.env).find((k) => k.startsWith("ADMIN_PASSWORD_PUT_"));
  if (key && process.env[key]) return String(process.env[key]);
  if (process.env.ADMIN_PASSWORD) return String(process.env.ADMIN_PASSWORD);
  return "";
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function cookieOpts(): { path: string; httpOnly: boolean; secure: boolean; sameSite: "lax" } {
  // Клієнт ходить через l2dop.com/api/admin/... → cookie має летіти туди
  return {
    path: "/api/admin",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
  };
}

export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  // POST /admin/auth/login
  app.post("/login", async (request, reply) => {
    const body = request.body as any;
    const login = String(body?.login ?? "").trim();
    const password = String(body?.password ?? "");

    const envLogin = String(process.env.ADMIN_LOGIN ?? "");
    const envPassword = getAdminPasswordFromEnv();

    if (!envLogin || !envPassword) {
      return reply.code(500).send({ error: "Admin env is not configured" });
    }

    if (login !== envLogin || password !== envPassword) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const sid = createAdminSession(envLogin);
    reply.setCookie("admin_session", sid, cookieOpts());
    return { ok: true };
  });

  // GET /admin/auth/me
  app.get("/me", { preHandler: [requireAdmin] }, async (req) => {
    return { ok: true, admin: (req as any).admin };
  });

  // GET /admin/auth/secure-ping
  app.get("/secure-ping", { preHandler: [requireAdmin] }, async () => {
    return { ok: true, pong: true };
  });

  // POST /admin/auth/logout — очищаємо cookie тими самими атрибутами (path, sameSite, secure)
  app.post("/logout", async (request, reply) => {
    const sid = request.cookies?.admin_session;
    deleteAdminSession(sid);
    reply.clearCookie("admin_session", cookieOpts());
    return { ok: true };
  });
};
