/**
 * Читає tools/jewelry-stats-raw.json (numeric id → stats) та itemMappings,
 * генерує src/data/shop/jewelryStatsByShopId.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawJson = fs.readFileSync(path.join(__dirname, "jewelry-stats-raw.json"), "utf8").replace(/^\uFEFF/, "");
const raw = JSON.parse(rawJson);

const mapPath = path.join(__dirname, "../src/data/shop/itemMappings.ts");
const mapSrc = fs.readFileSync(mapPath, "utf8");
const rev = {};
for (const m of mapSrc.matchAll(/\s+(\d+):\s*"(shop_jewelry_[^"]+)"/g)) {
  rev[m[1]] = m[2];
}

const byShopId = {};
for (const [num, stats] of Object.entries(raw)) {
  const sid = rev[num];
  if (!sid) {
    console.warn("no mapping for item id", num);
    continue;
  }
  byShopId[sid] = stats;
}

const body = `// Автоген з tools/fetch-l2elo-jewelry-stats.mjs + gen-jewelry-stats-ts.mjs (l2elo.com Interlude-подібні M.Def / MP)
export type ShopJewelryStats = { mDef: number; maxMp?: number };

export const SHOP_JEWELRY_STATS: Record<string, ShopJewelryStats> = ${JSON.stringify(byShopId, null, 2)};
`;

const outPath = path.join(__dirname, "../src/data/shop/jewelryStatsByShopId.ts");
fs.writeFileSync(outPath, body, "utf8");
console.log("Wrote", outPath, "keys", Object.keys(byShopId).length);
