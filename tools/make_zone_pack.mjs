// Виклик: node tools/make_zone_pack.mjs <cityId> <zoneId>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../src/data/mobs/by-zone");

const [,, cityId, zoneId] = process.argv;
if (!cityId || !zoneId) {
  console.log("Використання: node tools/make_zone_pack.mjs <cityId> <zoneId>");
  process.exit(1);
}

const dir = path.join(ROOT, cityId);
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${zoneId}.json`);
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({ mobs: [] }, null, 2), "utf-8");
  console.log("✔ Створено:", file);
} else {
  console.log("• Вже існує:", file);
}
