import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { encrypt, decrypt } from "../admin/crypto";
import { sha256 } from "../admin/sha256";
import { requireAdmin } from "../admin/requireAdmin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function env() {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;
  if (!login || !password) throw new Error("ADMIN_LOGIN/ADMIN_PASSWORD missing");
  return { login, password };
}

function signAccess(payload: object) {
  const secret: Secret = process.env.ADMIN_JWT_SECRET || "dev_secret";
  const ttl = (process.env.ADMIN_JWT_TTL ?? "10m") as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn: ttl });
}

function setAdminRt(reply: any, plain: string) {
  reply.setCookie("admin_rt", plain, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin/auth",
  });
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // 1) setup MFA → віддає QR (data URL)
  app.post("/admin/auth/setup", async () => {
    const { login } = env();
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(login, "L2Dop Admin", secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    await prisma.adminMfa.upsert({
      where: { login },
      update: { secretEnc: encrypt(secret) },
      create: { login, secretEnc: encrypt(secret) },
    });

    return { login, qrDataUrl };
  });

  // 2) enable MFA → підтверди перший код з додатку
  app.post("/admin/auth/enable", async (req, reply) => {
    const { login } = env();
    const { code } = req.body as any;

    const row = await prisma.adminMfa.findUnique({ where: { login } });
    if (!row) return reply.code(400).send({ error: "MFA not setup" });

    const secret = decrypt(row.secretEnc);
    if (!authenticator.check(String(code || ""), secret)) {
      return reply.code(401).send({ error: "Invalid TOTP" });
    }

    await prisma.adminMfa.update({ where: { login }, data: { enabledAt: new Date() } });
    return { ok: true };
  });

  // 3) login → password + totp → accessToken + cookie admin_rt
  app.post("/admin/auth/login", async (req, reply) => {
    const { login, password } = env();
    const body = req.body as any;

    if (String(body?.login || "") !== login || String(body?.password || "") !== password) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const mfa = await prisma.adminMfa.findUnique({ where: { login } });
    if (!mfa?.enabledAt) return reply.code(400).send({ error: "MFA not enabled" });

    const secret = decrypt(mfa.secretEnc);
    if (!authenticator.check(String(body?.code || ""), secret)) {
      return reply.code(401).send({ error: "Invalid TOTP" });
    }

    const accessToken = signAccess({ login, amr: ["pwd", "mfa"] });

    const plain = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(plain);
    const days = Number(process.env.ADMIN_REFRESH_TTL_DAYS || "30");
    const expiresAt = new Date(Date.now() + days * 86400_000);

    await prisma.adminRefreshToken.create({
      data: { login, tokenHash, expiresAt },
    });

    setAdminRt(reply, plain);
    return { accessToken };
  });

  // 4) refresh → ротація admin_rt
  app.post("/admin/auth/refresh", async (req, reply) => {
    const { login } = env();
    const plain = (req.cookies as any)?.admin_rt as string | undefined;
    if (!plain) return reply.code(401).send({ error: "No admin refresh token" });

    const tokenHash = sha256(plain);
    const row = await prisma.adminRefreshToken.findUnique({ where: { tokenHash } });
    if (!row || row.revokedAt || row.expiresAt < new Date() || row.login !== login) {
      return reply.code(401).send({ error: "Invalid admin refresh token" });
    }

    await prisma.adminRefreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const newPlain = crypto.randomBytes(32).toString("hex");
    const newHash = sha256(newPlain);
    const days = Number(process.env.ADMIN_REFRESH_TTL_DAYS || "30");
    const expiresAt = new Date(Date.now() + days * 86400_000);

    await prisma.adminRefreshToken.create({ data: { login, tokenHash: newHash, expiresAt } });
    setAdminRt(reply, newPlain);

    const accessToken = signAccess({ login, amr: ["mfa"] });
    return { accessToken };
  });

  // 5) ping → перевірка доступу
  app.get("/admin/ping", { preHandler: [requireAdmin] }, async (req) => {
    return { ok: true, as: (req as any).admin?.login ?? "unknown" };
  });
};
