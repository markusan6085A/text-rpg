import type { FastifyInstance } from "fastify";
import { characterListRoutes } from "./character-list";
import { characterCrudRoutes } from "./character-crud";
import { characterActionsRoutes } from "./character-actions";
import { characterFishingRoutes } from "./character-fishing";
import { characterOnlineRoutes } from "./character-online";
import { characterGkTeleportRoutes } from "./character-gk-teleport";

export async function characterRoutes(app: FastifyInstance) {
  await app.register(characterGkTeleportRoutes);
  await app.register(characterListRoutes);
  await app.register(characterCrudRoutes);
  await app.register(characterActionsRoutes);
  await app.register(characterFishingRoutes);
  await app.register(characterOnlineRoutes);
}
