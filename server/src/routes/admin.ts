import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // public ping (для тесту)
  app.get("/admin/ping", async () => ({ ok: true }));

  // protected ping
  app.get("/admin/secure-ping", { preHandler: requireAdmin }, async () => {
    return { ok: true, admin: true };
  });

  // приклад "адмін API": статистика
  app.get("/admin/stats", { preHandler: requireAdmin }, async () => {
    return {
      ok: true,
      uptimeSec: Math.floor(process.uptime()),
      nodeEnv: process.env.NODE_ENV || "unknown",
    };
  });
};
