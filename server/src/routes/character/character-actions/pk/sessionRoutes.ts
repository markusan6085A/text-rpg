import type { FastifyInstance } from "fastify";
import { registerPkSessionStartRoute } from "./sessionRouteStart";
import { registerPkSessionSyncStatsRoute } from "./sessionRouteSyncStats";
import { registerPkSessionArenaFleeRoute } from "./sessionRouteArenaFlee";
import { registerPkSessionGetRoute } from "./sessionRouteGetSession";
import { registerPkSessionActRoute } from "./sessionRouteAct";
import { registerPkArenaHttpRoutes } from "./sessionRouteArenaHttp";
import { registerArenaLeaderboardRoute } from "./sessionRouteLeaderboard";
import { registerPvpStatsRoute } from "./sessionRoutePvpStats";
import { registerCharacterPkStateRoute } from "./sessionRouteCharacterPkState";
import { registerPkResolveDeprecatedRoute } from "./sessionRouteResolveDeprecated";

export async function registerPkSessionRoutes(app: FastifyInstance) {
  registerPkSessionStartRoute(app);
  registerPkSessionSyncStatsRoute(app);
  registerPkSessionArenaFleeRoute(app);
  registerPkSessionGetRoute(app);
  registerPkSessionActRoute(app);
  registerPkArenaHttpRoutes(app);
  registerArenaLeaderboardRoute(app);
  registerPvpStatsRoute(app);
  registerCharacterPkStateRoute(app);
  registerPkResolveDeprecatedRoute(app);
}
