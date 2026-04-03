/**
 * Full id -> meta for items in itemsDB_d/c/b/a/s (for server fishing drops)
 * Run (from repo root): node tools/genFishingItemMeta.mjs > server/src/data/fishingDropItemMeta.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const files = [
  "src/data/items/itemsDB_d.ts",
  "src/data/items/itemsDB_c.ts",
  "src/data/items/itemsDB_b.ts",
  "src/data/items/itemsDB_a.ts",
  "src/data/items/itemsDB_s.ts",
];

function extractEntries(ts) {
  const re = /\n  ([a-z0-9_]+): \{/g;
  const starts = [];
  let m;
  while ((m = re.exec(ts))) {
    starts.push({ id: m[1], braceStart: m.index + m[0].length - 1 });
  }
  const entries = [];
  for (let i = 0; i < starts.length; i++) {
    const { id, braceStart } = starts[i];
    let depth = 0;
    let j = braceStart;
    for (; j < ts.length; j++) {
      const c = ts[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    const body = ts.slice(braceStart, j);
    entries.push({ id, body });
  }
  return entries;
}

const meta = {};
for (const rel of files) {
  const ts = fs.readFileSync(path.join(root, rel), "utf8");
  for (const { id, body } of extractEntries(ts)) {
    const nameM = body.match(/name:\s*\"([^\"]*)\"/);
    const iconM = body.match(/icon:\s*\"([^\"]*)\"/);
    const slotM = body.match(/slot:\s*\"([^\"]*)\"/);
    const kindM = body.match(/kind:\s*\"([^\"]*)\"/);
    const gradeM = body.match(/grade:\s*\"([DCBAS])\"/);
    if (!nameM || !slotM || !kindM) continue;
    meta[id] = {
      name: nameM[1],
      icon: iconM ? iconM[1] : "/items/default_item.png",
      slot: slotM[1],
      kind: kindM[1],
      grade: gradeM ? gradeM[1] : undefined,
    };
  }
}

const craftPath = path.join(root, "src/data/items/itemsDBCraftResources.ts");
const craftTs = fs.readFileSync(craftPath, "utf8");
for (const { id, body } of extractEntries(craftTs)) {
  const nameM = body.match(/name:\s*\"([^\"]*)\"/);
  const iconM = body.match(/icon:\s*\"([^\"]*)\"/);
  const slotM = body.match(/slot:\s*\"([^\"]*)\"/);
  const kindM = body.match(/kind:\s*\"([^\"]*)\"/);
  if (!nameM || !slotM || !kindM) continue;
  meta[id] = {
    name: nameM[1],
    icon: iconM ? iconM[1] : "/items/default_item.png",
    slot: slotM[1],
    kind: kindM[1],
  };
}

console.error("meta entries", Object.keys(meta).length);
console.log(JSON.stringify(meta, null, 2));
