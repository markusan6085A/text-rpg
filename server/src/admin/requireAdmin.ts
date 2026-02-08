import type { FastifyReply, FastifyRequest } from "fastify";
import jwt, { type Secret } from "jsonwebtoken";

export function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return reply.code(401).send({ error: "Unauthorized" });

  const secret: Secret = process.env.ADMIN_JWT_SECRET || "dev_secret";
  try {
    const payload = jwt.verify(token, secret) as any;
    (req as any).admin = payload;
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
