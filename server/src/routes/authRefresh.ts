import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import {
  getRefreshCookie,
  clearRefreshCookie,
  setRefreshCookie,
  sha256,
  randomToken,
  addDays,
} from "../auth/refresh";

export const authRefreshRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/refresh", async (req, reply) => {
    const refreshPlain = getRefreshCookie(req);
    if (!refreshPlain) return reply.code(401).send({ error: "No refresh token" });

    const refreshHash = sha256(refreshPlain);

    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: refreshHash },
      include: { account: { select: { id: true, login: true } } },
    });

    if (!row || row.revokedAt) {
      clearRefreshCookie(reply);
      return reply.code(401).send({ error: "Invalid refresh token" });
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      await prisma.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
      clearRefreshCookie(reply);
      return reply.code(401).send({ error: "Refresh expired" });
    }

    const newPlain = randomToken(32);
    const newHash = sha256(newPlain);
    const days = Number(process.env.REFRESH_TTL_DAYS || "30");
    const newExpires = addDays(new Date(), days);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          accountId: row.accountId,
          tokenHash: newHash,
          expiresAt: newExpires,
        },
      }),
    ]);

    setRefreshCookie(reply, newPlain);

    const secret = process.env.JWT_SECRET;
    if (!secret) return reply.code(500).send({ error: "JWT_SECRET not configured" });
    const accessTtl = process.env.ACCESS_TTL || "15m";
    const accessToken = jwt.sign(
      { accountId: row.account.id, login: row.account.login },
      secret,
      { expiresIn: accessTtl }
    );

    return reply.send({ accessToken });
  });
};
