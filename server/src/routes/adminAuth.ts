import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

// ВАЖЛИВО:
// - ADMIN_LOGIN = "Existence"
// - ADMIN_PASSWORD береться з твого .env (в тебе ключ нестандартний типу ADMIN_PASSWORD_PUT_...)
// - ADMIN_JWT_SECRET = довгий random
// - ADMIN_JWT_TTL = "10m" (або "30m" etc)

function getAdminPasswordFromEnv(): string {
  // шукаємо будь-який ключ виду ADMIN_PASSWORD_PUT_*
  const key = Object.keys(process.env).find((k) => k.startsWith("ADMIN_PASSWORD_PUT_"));
  if (key && process.env[key]) return String(process.env[key]);
  // fallback якщо ти захочеш нормальний ключ
  if (process.env.ADMIN_PASSWORD) return String(process.env.ADMIN_PASSWORD);
  return "";
}

function signAdminToken(payload: object) {
  const secret = process.env.ADMIN_JWT_SECRET || "";
  if (!secret) throw new Error("ADMIN_JWT_SECRET is missing");
  const ttl = process.env.ADMIN_JWT_TTL || "10m";
  return jwt.sign(payload, secret, { expiresIn: ttl });
}

function verifyAdminToken(token: string) {
  const secret = process.env.ADMIN_JWT_SECRET || "";
  if (!secret) throw new Error("ADMIN_JWT_SECRET is missing");
  return jwt.verify(token, secret) as any;
}

export function requireAdmin(request: FastifyRequest) {
  const auth = request.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    const err: any = new Error("Missing Bearer token");
    err.statusCode = 401;
    throw err;
  }
  try {
    const decoded = verifyAdminToken(token);
    (request as any).admin = decoded;
  } catch {
    const err: any = new Error("Invalid token");
    err.statusCode = 401;
    throw err;
  }
}

export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  // POST /login → /admin/auth/login з prefix
  app.post("/login", async (request, reply) => {
    const body = request.body as any;

    const login = String(body?.login || "");
    const password = String(body?.password || "");

    const envLogin = String(process.env.ADMIN_LOGIN || "");
    const envPassword = getAdminPasswordFromEnv();

    if (!envLogin || !envPassword) {
      return reply.code(500).send({ error: "Admin env is not configured" });
    }

    if (login !== envLogin || password !== envPassword) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = signAdminToken({ login: envLogin, role: "admin" });
    return { token };
  });

  // GET /me
  app.get("/me", async (request) => {
    requireAdmin(request);
    return { ok: true, admin: (request as any).admin };
  });

  // GET /secure-ping
  app.get("/secure-ping", async (request) => {
    requireAdmin(request);
    return { ok: true };
  });
};
