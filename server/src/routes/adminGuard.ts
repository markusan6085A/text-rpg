import type { FastifyRequest, FastifyReply } from "fastify";
import { getAdminSession } from "../adminSessions";

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sid = req.cookies?.admin_session;
  const session = getAdminSession(sid);

  if (!session) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }

  (req as any).admin = { login: session.adminLogin };
}
