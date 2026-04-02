import type { FastifyInstance } from "fastify";
import { registerClanInviteRoutes } from "./routes/clans/invites";
import { registerClanApplicationRoutes } from "./routes/clans/applications";
import { clanNestedRoutes } from "./clans/clanNestedRoutes";
import { registerClanTopLevelRoutes } from "./clans/registerClanTopLevelRoutes";

export async function clanRoutes(app: FastifyInstance) {
  // 🔥 Invites/applications — до /clans/:id (щоб /clans/invites не матчилось як :id)
  registerClanInviteRoutes(app);
  registerClanApplicationRoutes(app);

  // Вкладені роути /clans/:id/...
  await app.register(clanNestedRoutes, { prefix: "" });

  registerClanTopLevelRoutes(app);
}
