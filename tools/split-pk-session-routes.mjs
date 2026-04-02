/**
 * One-shot: expects monolithic `server/src/routes/character/character-actions/pk/sessionRoutes.ts`.
 * Re-run only from git history if the file was already split.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "server/src/routes/character/character-actions/pk/sessionRoutes.ts");
const pkDir = path.join(root, "server/src/routes/character/character-actions/pk");
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);

function dedent2(chunk) {
  return chunk
    .split("\n")
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n");
}

function slice(a, b) {
  return lines.slice(a, b).join("\n");
}

/** Lines 865–940 (1-based): arena field state + helpers (was inside registerPkSessionRoutes). */
let arenaStateBody = dedent2(slice(864, 940));
arenaStateBody = arenaStateBody
  .replace(/^type ArenaFieldEntry/m, "export type ArenaFieldEntry")
  .replace(/^const arenaField/m, "export const arenaField")
  .replace(/^const ARENA_FIELD_IDLE_MS/m, "export const ARENA_FIELD_IDLE_MS")
  .replace(/^const ARENA_FIELD_MAX/m, "export const ARENA_FIELD_MAX")
  .replace(/^function pruneArenaField/m, "export function pruneArenaField")
  .replace(/^async function hasActiveArenaSession/m, "export async function hasActiveArenaSession")
  .replace(/^function activeSevenSealsRankFromBonus/m, "export function activeSevenSealsRankFromBonus")
  .replace(/^async function enrichArenaFieldPlayers/m, "export async function enrichArenaFieldPlayers");

fs.writeFileSync(
  path.join(pkDir, "arenaFieldState.ts"),
  `import { prisma } from "../../../../db";
import { getEffectiveNickColor } from "../../../../effectiveNickColor";
import { isArenaLikeSession } from "./types";
import { pkSessions } from "./store";

${arenaStateBody}
`
);

const wrap = (name, imports, bodySlice) => `${imports}
export function ${name}(app: FastifyInstance): void {
${bodySlice}
}
`;

const impFastify = `import type { FastifyInstance } from "fastify"`;

fs.writeFileSync(
  path.join(pkDir, "sessionRouteStart.ts"),
  wrap(
    "registerPkSessionStartRoute",
    `${impFastify};
import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import type { PkSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb } from "./store";
import { buildPkFighter, getLocation, isOnline, serializePkSession } from "./helpers";`,
    slice(31, 144)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteSyncStats.ts"),
  wrap(
    "registerPkSessionSyncStatsRoute",
    `${impFastify};
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { isArenaLikeSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import { serializePkSession } from "./helpers";
import { syncPkRealtimeState, syncArenaHpOnly } from "./sync";`,
    slice(145, 218)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteArenaFlee.ts"),
  wrap(
    "registerPkSessionArenaFleeRoute",
    `${impFastify};
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import { isArenaLikeSession, isTvtSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import { serializePkSession, refreshPkFighterStatsFromDb } from "./helpers";
import { abortTvtMatchOnFlee } from "../tvt/engine";`,
    slice(219, 288)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteGetSession.ts"),
  wrap(
    "registerPkSessionGetRoute",
    `${impFastify};
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import { isArenaLikeSession, isTvtSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import {
  ensurePkFighterElementalFields,
  getLocation,
  isOnline,
  serializePkSession,
  refreshPkFighterStatsFromDb,
} from "./helpers";
import { abortTvtMatchOnFlee } from "../tvt/engine";`,
    slice(289, 371)
  )
);

const actImports = `${impFastify};
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import type { PkFighter, PkSession, PkSkill } from "./types";
import { isArenaLikeSession, isTvtSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import {
  ensurePkFighterElementalFields,
  getLocation,
  isOnline,
  serializePkSession,
  refreshPkFighterStatsFromDb,
  computeDamage,
  formatPkAttackSkillFailureMessage,
  resolvePkAttackSkillCooldownMs,
} from "./helpers";
import { syncPkRealtimeState, syncArenaHpOnly } from "./sync";
import { savePkResultIfNeeded } from "./results";
import { abortTvtMatchOnFlee } from "../tvt/engine"`;

fs.writeFileSync(
  path.join(pkDir, "sessionRouteAct.ts"),
  `${actImports}
export function registerPkSessionActRoute(app: FastifyInstance): void {
${slice(372, 863)}
}
`
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteArenaHttp.ts"),
  wrap(
    "registerPkArenaHttpRoutes",
    `${impFastify};
import { randomUUID } from "crypto";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import type { PkSession } from "./types";
import { isArenaLikeSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import { buildPkFighter, getLocation, isOnline, serializePkSession } from "./helpers";
import {
  arenaField,
  ARENA_FIELD_MAX,
  pruneArenaField,
  hasActiveArenaSession,
  enrichArenaFieldPlayers,
} from "./arenaFieldState";`,
    slice(941, 1201)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteLeaderboard.ts"),
  wrap(
    "registerArenaLeaderboardRoute",
    `${impFastify};
import { prisma } from "../../../../db";
import { ensureArenaLeaderboardTable } from "./results";`,
    slice(1202, 1219)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRoutePvpStats.ts"),
  wrap(
    "registerPvpStatsRoute",
    `${impFastify};
import { prisma } from "../../../../db";
import { ensureArenaLeaderboardTable } from "./results";`,
    slice(1220, 1265)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteCharacterPkState.ts"),
  wrap(
    "registerCharacterPkStateRoute",
    `${impFastify};
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import type { PkSession } from "./types";
import { pkSessions } from "./store";
import { getEffectivePkNickColor } from "./helpers";`,
    slice(1266, 1364)
  )
);

fs.writeFileSync(
  path.join(pkDir, "sessionRouteResolveDeprecated.ts"),
  wrap(
    "registerPkResolveDeprecatedRoute",
    `${impFastify};`,
    slice(1365, 1368)
  )
);

const thin = `${impFastify};
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
`;

fs.writeFileSync(src, thin);
console.log("Split pk sessionRoutes into pk/*.ts");
