import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";
import { requireAdmin } from "./adminGuard";

function parseDateOrNull(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export const adminLogsRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/logs?action=&adminLogin=&target=&status=&from=&to=&page=&limit=
  app.get("/", { preHandler: [requireAdmin] }, async (req) => {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const action = String(q.action || "").trim();
    const adminLogin = String(q.adminLogin || "").trim();
    const target = String(q.target || "").trim();
    const status = String(q.status || "").trim();
    const from = parseDateOrNull(q.from);
    const to = parseDateOrNull(q.to);
    const page = Math.max(1, Number.parseInt(String(q.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(q.limit || "20"), 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (adminLogin) where.adminLogin = { contains: adminLogin, mode: "insensitive" };
    if (status) where.status = status;
    if (target) {
      where.OR = [
        { targetCharacterId: { contains: target, mode: "insensitive" } },
        { targetCharacterName: { contains: target, mode: "insensitive" } },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [logs, total] = await Promise.all([
      prisma.adminActionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminActionLog.count({ where }),
    ]);

    return {
      ok: true,
      logs,
      total,
      page,
      limit,
    };
  });
};

