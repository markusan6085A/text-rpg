import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

function getAdminPasswordEnvKey(): string {
  // Ти просив: "як в нотатнику". У тебе ключ має префікс:
  // ADMIN_PASSWORD_PUT_...
  // Тому беремо перший env, який починається з ADMIN_PASSWORD_PUT_
  const key = Object.keys(process.env).find((k) => k.startsWith("ADMIN_PASSWORD_PUT_"));
  if (!key) throw new Error("ADMIN_PASSWORD_PUT_* is missing");
  return key;
}

function signAdminToken(login: string) {
  const secret = mustEnv("ADMIN_JWT_SECRET");
  const ttl = process.env.ADMIN_JWT_TTL || "10m"; // як у тебе
  return jwt.sign({ role: "admin", login }, secret, { expiresIn: ttl });
}

function verifyAdminToken(token: string) {
  const secret = mustEnv("ADMIN_JWT_SECRET");
  return jwt.verify(token, secret) as any;
}

export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  // POST /admin/auth/login  { login, password }
  app.post("/admin/auth/login", async (request, reply) => {
    const body = request.body as any;
    const login = String(body?.login ?? "").trim();
    const password = String(body?.password ?? "");

    const ADMIN_LOGIN = mustEnv("ADMIN_LOGIN");
    const passKey = getAdminPasswordEnvKey();
    const ADMIN_PASSWORD = mustEnv(passKey);

    if (!login || !password) return reply.code(400).send({ error: "Bad request" });

    if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = signAdminToken(login);
    return { ok: true, token };
  });

  // GET /admin/me  (Authorization: Bearer ...)
  app.get("/admin/me", async (request, reply) => {
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return reply.code(401).send({ error: "No token" });

    try {
      const decoded = verifyAdminToken(token);
      if (decoded?.role !== "admin") return reply.code(403).send({ error: "Forbidden" });

      // existence-only — просто повертаємо login
      return { ok: true, admin: { login: decoded.login } };
    } catch {
      return reply.code(401).send({ error: "Invalid token" });
    }
  });
};
