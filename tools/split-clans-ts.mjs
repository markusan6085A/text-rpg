import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "server/src/clans.ts");
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);

const ensureBody = lines.slice(10, 112).join("\n").replace(
  /^async function ensureClanWarehouseTable/,
  "export async function ensureClanWarehouseTable"
);

const nestedBody = lines
  .slice(114, 890)
  .join("\n")
  .replace(
    "async function clanNestedRoutes",
    "export async function clanNestedRoutes"
  );

const topBody = lines.slice(899, 1790).join("\n");

const outDir = path.join(root, "server/src/clans");
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "ensureClanWarehouseTable.ts"),
  `import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

${ensureBody}
`
);

fs.writeFileSync(
  path.join(outDir, "clanNestedRoutes.ts"),
  `import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { getAuth } from "../routes/character/auth";
import { addVersioning } from "../heroJsonValidator";
import { removeItemFromInventory, addItemToInventory, pickSafeItemFields } from "../utils/inventoryHelpers";
import { registerClanInviteNestedRoutes } from "../routes/clans/invites";
import { registerClanApplicationNestedRoutes } from "../routes/clans/applications";
import { registerClanMemberNestedRoutes } from "../routes/clans/members";
import { ensureClanWarehouseTable } from "./ensureClanWarehouseTable";

${nestedBody}
`
);

fs.writeFileSync(
  path.join(outDir, "registerClanTopLevelRoutes.ts"),
  `import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { getAuth } from "../routes/character/auth";

export function registerClanTopLevelRoutes(app: FastifyInstance): void {
${topBody}
}
`
);

const thinClansFixed = `import type { FastifyInstance } from "fastify";
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
`;

fs.writeFileSync(src, thinClansFixed);

console.log("Wrote server/src/clans/* and slimmed server/src/clans.ts");
