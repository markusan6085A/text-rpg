import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // public ping (для тесту)
  app.get("/admin/ping", async () => ({ ok: true }));

  // приклад "адмін API": статистика (/admin/secure-ping в adminAuth)
  app.get("/admin/stats", { preHandler: requireAdmin }, async () => {
    return {
      ok: true,
      uptimeSec: Math.floor(process.uptime()),
      nodeEnv: process.env.NODE_ENV || "unknown",
    };
  });
};
