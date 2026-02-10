import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { createAdminSession, deleteAdminSession } from "../adminSessions";
import { requireAdmin } from "./adminGuard";
import { issueTokens } from "../auth";
import { prisma } from "../db";

function getAdminPasswordFromEnv(): string {
  const key = Object.keys(process.env).find((k) => k.startsWith("ADMIN_PASSWORD_PUT_"));
  if (key && process.env[key]) return String(process.env[key]);
  if (process.env.ADMIN_PASSWORD) return String(process.env.ADMIN_PASSWORD);
  return "";
}

/** Другий адмін: пароль з ADMIN_PASSWORD_PUT_2_* або ADMIN_PASSWORD_2 */
function getAdmin2PasswordFromEnv(): string {
  const key = Object.keys(process.env).find((k) => k.startsWith("ADMIN_PASSWORD_PUT_2_"));
  if (key && process.env[key]) return String(process.env[key]);
  if (process.env.ADMIN_PASSWORD_2) return String(process.env.ADMIN_PASSWORD_2);
  return "";
}

/** Список [login, password] для перевірки логіну (основний + опційно другий адмін) */
function getAdminCredentials(): Array<[string, string]> {
  const list: Array<[string, string]> = [];
  const login1 = String(process.env.ADMIN_LOGIN ?? "").trim();
  const pass1 = getAdminPasswordFromEnv();
  if (login1 && pass1) list.push([login1, pass1]);
  const login2 = String(process.env.ADMIN_LOGIN_2 ?? "").trim();
  const pass2 = getAdmin2PasswordFromEnv();
  if (login2 && pass2) list.push([login2, pass2]);
  return list;
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function cookieOpts(): { path: string; httpOnly: boolean; secure: boolean; sameSite: "lax" } {
  // Якщо фронт ходить напряму на api.l2dop.com → шлях /admin. Якщо через проксі l2dop.com/api/... → /api/admin
  const path = process.env.ADMIN_COOKIE_PATH || "/api/admin";
  return {
    path,
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

    const credentials = getAdminCredentials();
    if (credentials.length === 0) {
      return reply.code(500).send({ error: "Admin env is not configured" });
    }

    const matched = credentials.find(([l, p]) => l === login && p === password);
    if (!matched) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const adminLoginName = matched[0];
    const adminPassword = matched[1];

    // Знайти або створити гровий акаунт з тим самим логіном — щоб адмін міг грати як гравець
    let account = await prisma.account.findUnique({
      where: { login: adminLoginName },
      select: { id: true, login: true },
    });
    if (!account) {
      const passHash = await bcrypt.hash(adminPassword, 10);
      account = await prisma.account.create({
        data: { login: adminLoginName, passHash },
        select: { id: true, login: true },
      });
    }

    const { accessToken } = await issueTokens(reply, account);

    const sid = createAdminSession(adminLoginName);
    reply.setCookie("admin_session", sid, cookieOpts());
    return { ok: true, accessToken };
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
