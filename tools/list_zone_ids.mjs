// tools/list_zone_ids.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORLD_DIR = path.resolve(__dirname, "../src/data/world");

const files = fs.readdirSync(WORLD_DIR).filter(f => f.endsWith(".json"));
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(WORLD_DIR, f), "utf-8"));
  console.log(`\nCITY: ${j.name}  id=${j.id}`);
  for (const z of j.zones) {
    console.log(`  - ZONE: ${z.name}  id=${z.id}`);
  }
}
