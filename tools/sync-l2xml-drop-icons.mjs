/**
 * Копіює іконки ресурсів у public/items/drops/resources/l2drop-by-itemid/{id}.jpg
 * за списком l2ItemId з l2XmlDrops.generated.ts.
 *
 * Покладіть експорт іконок з клієнта/L2 у папку, де файли названі як {id}.jpg або {id}.png.
 *
 *   node tools/sync-l2xml-drop-icons.mjs --from "D:\L2icons\export"
 *
 * Без --from: лише виводить унікальні id (для перевірки).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const GENERATED = path.join(root, "src", "data", "world", "l2dop", "l2XmlDrops.generated.ts");
const OUT_DIR = path.join(root, "public", "items", "drops", "resources", "l2drop-by-itemid");

function parseArgs() {
  const a = process.argv.slice(2);
  let from = "";
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--from" && a[i + 1]) {
      from = a[++i];
    }
  }
  return { from };
}

function uniqueL2ItemIds() {
  const txt = fs.readFileSync(GENERATED, "utf8");
  const set = new Set();
  const re = /l2ItemId:\s*(\d+)/g;
  let m;
  while ((m = re.exec(txt)) !== null) {
    set.add(Number(m[1]));
  }
  return [...set].sort((a, b) => a - b);
}

function main() {
  const { from } = parseArgs();
  const ids = uniqueL2ItemIds();
  console.log("Unique l2ItemId in L2 XML drops:", ids.length);
  if (!from) {
    console.log(ids.join(", "));
    console.log("\nЩоб скопіювати іконки: node tools/sync-l2xml-drop-icons.mjs --from <шлях_до_папки>");
    return;
  }

  if (!fs.existsSync(from)) {
    console.error("Folder not found:", from);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let copied = 0;
  let skipped = 0;
  const missing = [];

  for (const id of ids) {
    const jpg = path.join(from, `${id}.jpg`);
    const png = path.join(from, `${id}.png`);
    const destJpg = path.join(OUT_DIR, `${id}.jpg`);
    const destPng = path.join(OUT_DIR, `${id}.png`);

    if (fs.existsSync(jpg)) {
      fs.copyFileSync(jpg, destJpg);
      copied++;
    } else if (fs.existsSync(png)) {
      fs.copyFileSync(png, destPng);
      copied++;
    } else {
      missing.push(id);
      skipped++;
    }
  }

  console.log("Copied:", copied, "Missing in --from:", skipped);
  if (missing.length && missing.length <= 40) {
    console.log("Missing ids:", missing.join(", "));
  } else if (missing.length) {
    const listPath = path.join(OUT_DIR, "_missing_icon_ids.txt");
    fs.writeFileSync(listPath, missing.join("\n"), "utf8");
    console.log("Wrote missing list:", listPath);
  }
}

main();
