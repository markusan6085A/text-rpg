import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

function signToken(payload: { accountId: string; login: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing in .env");
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register  { login, password }
  app.post("/auth/register", async (req, reply) => {
    try {
      const body = req.body as { login?: string; password?: string };
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

      const token = signToken({ accountId: account.id, login: account.login });

      return {
        ok: true,
        account,
        token,
      };
    } catch (error) {
      app.log.error(error, "Registration error:");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      app.log.error({ message: errorMessage, stack: errorStack }, "Registration error details:");
      return reply.code(500).send({ 
        error: "Internal Server Error",
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      });
    }
  });

  // POST /auth/login  { login, password }
  app.post("/auth/login", async (req, reply) => {
    try {
      const body = req.body as { login?: string; password?: string };
      const login = (body.login ?? "").trim();
      const password = body.password ?? "";

      const account = await prisma.account.findUnique({ where: { login } });
      if (!account) return reply.code(401).send({ error: "invalid credentials" });

      const ok = await bcrypt.compare(password, account.passHash);
      if (!ok) return reply.code(401).send({ error: "invalid credentials" });

      const token = signToken({ accountId: account.id, login: account.login });

      return {
        ok: true,
        account: { id: account.id, login: account.login },
        token,
      };
    } catch (error) {
      app.log.error(error, "Login error:");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      app.log.error({ message: errorMessage, stack: errorStack }, "Login error details:");
      return reply.code(500).send({ 
        error: "Internal Server Error",
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      });
    }
  });
}
