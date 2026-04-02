import type { FastifyInstance } from "fastify";
export function registerPkResolveDeprecatedRoute(app: FastifyInstance): void {
  app.post("/characters/pk/resolve", async (req, reply) => {
    return reply.code(410).send({ error: "deprecated", message: "Use /characters/pk/session/* endpoints" });
  });
}
