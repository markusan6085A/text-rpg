import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "./adminGuard";
import { prisma } from "../db";
import { setMuted } from "../chatMute";

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

  // DELETE /admin/chat/messages/:id — адмін видаляє будь-яке повідомлення
  app.delete<{ Params: { id: string } }>("/chat/messages/:id", { preHandler: [requireAdmin] }, async (req, reply) => {
    const messageId = String((req.params as any)?.id ?? "").trim();
    if (!messageId) return reply.code(400).send({ error: "message id required" });
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId }, select: { id: true } });
    if (!message) return reply.code(404).send({ error: "message not found" });
    await prisma.chatMessage.delete({ where: { id: messageId } });
    return { ok: true };
  });

  // POST /admin/chat/mute — адмін мут гравця в чаті (characterId, durationMinutes)
  app.post<{ Body: { characterId?: string; durationMinutes?: number } }>("/chat/mute", { preHandler: [requireAdmin] }, async (req, reply) => {
    const characterId = String((req.body as any)?.characterId ?? "").trim();
    const durationMinutes = Math.min(60 * 24, Math.max(1, Number((req.body as any)?.durationMinutes ?? 10)));
    if (!characterId) return reply.code(400).send({ error: "characterId required" });
    setMuted(characterId, durationMinutes);
    return { ok: true };
  });
};
