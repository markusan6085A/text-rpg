import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { prisma } from "./db";
import { rateLimiters, rateLimitMiddleware } from "./rateLimiter";
import { randomToken, sha256, addDays, setRefreshCookie } from "./auth/refresh";

function signAccessToken(payload: { accountId: string; login: string }) {
  const secret: Secret = process.env.JWT_SECRET || "dev_secret";
  const ttl: SignOptions["expiresIn"] = process.env.JWT_TTL || "15m";
  return jwt.sign(payload, secret, { expiresIn: ttl });
}

export async function issueTokens(
  reply: import("fastify").FastifyReply,
  account: { id: string; login: string }
) {
  const accessToken = signAccessToken({ accountId: account.id, login: account.login });

  const refreshPlain = randomToken(32);
  const refreshHash = sha256(refreshPlain);
  const days = Number(process.env.REFRESH_TTL_DAYS || "30");
  const expiresAt = addDays(new Date(), days);

  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      tokenHash: refreshHash,
      expiresAt,
    },
  });

  setRefreshCookie(reply, refreshPlain);

  return { accessToken };
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register  { login, password }
  app.post("/auth/register", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.register, "register")(req, reply);
    },
  }, async (req, reply) => {
    try {
      const body = (req.body || {}) as { login?: string; password?: string };
      const login = (body.login ?? "").trim();
      const password = body.password ?? "";

      if (login.length < 3) return reply.code(400).send({ error: "login too short" });
      if (password.length < 6) return reply.code(400).send({ error: "password too short" });

      const exists = await prisma.account.findUnique({ where: { login } });
      if (exists) return reply.code(409).send({ error: "login already exists" });

      const passHash = await bcrypt.hash(password, 10);

      const account = await prisma.account.create({
        data: { login, passHash },
        select: { id: true, login: true, createdAt: true },
      });

      const { accessToken } = await issueTokens(reply, account);

      return reply.send({
        ok: true,
        account,
        accessToken,
      });
    } catch (error) {
      app.log.error(error, "Registration error:");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      app.log.error({ message: errorMessage, stack: errorStack }, "Registration error details:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      });
    }
  });

  // POST /auth/login  { login, password }
  app.post("/auth/login", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.auth, "login")(req, reply);
    },
  }, async (req, reply) => {
    try {
      const body = (req.body || {}) as { login?: string; password?: string };
      const login = (body.login ?? "").trim();
      const password = body.password ?? "";

      const account = await prisma.account.findUnique({ where: { login } });
      if (!account) return reply.code(401).send({ error: "invalid credentials" });

      const ok = await bcrypt.compare(password, account.passHash);
      if (!ok) return reply.code(401).send({ error: "invalid credentials" });

      const { accessToken } = await issueTokens(reply, account);

      return reply.send({
        ok: true,
        account: { id: account.id, login: account.login },
        accessToken,
      });
    } catch (error) {
      app.log.error(error, "Login error:");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      app.log.error({ message: errorMessage, stack: errorStack }, "Login error details:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      });
    }
  });
}
