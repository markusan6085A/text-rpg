import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";
import { getRefreshCookie, clearRefreshCookie, sha256 } from "../auth/refresh";

export const authLogoutRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/logout", async (req, reply) => {
    const refreshPlain = getRefreshCookie(req);
    if (refreshPlain) {
      const refreshHash = sha256(refreshPlain);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: refreshHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearRefreshCookie(reply);
    return reply.send({ ok: true });
  });
};
