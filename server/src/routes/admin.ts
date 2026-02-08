import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // GET /ping → /admin/ping з prefix
  app.get("/ping", async () => ({ ok: true }));

  // GET /stats → /admin/stats
  app.get("/stats", { preHandler: requireAdmin }, async () => {
    return {
      ok: true,
      uptimeSec: Math.floor(process.uptime()),
      nodeEnv: process.env.NODE_ENV || "unknown",
    };
  });
};
