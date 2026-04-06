/**
 * Бандл recalculateAllStats з кореневого src/ → server/dist/statsRecalc.cjs
 * (tsc сервера не може імпортувати файли поза server/src).
 */
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outfile = path.join(root, "server", "dist", "statsRecalc.cjs");

fs.mkdirSync(path.dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, "tools", "serverRecalcEntry.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile,
  format: "cjs",
  logLevel: "warning",
  define: {
    "import.meta.env.DEV": "false",
  },
});

console.log(`[buildServerStatsRecalc] wrote ${path.relative(root, outfile)}`);
