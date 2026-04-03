/**
 * Prints weapon/armor/jewelry ids per grade from itemsDB_*.ts
 * Run: node tools/genFishingEquipPools.mjs > server/src/data/fishingEquipPools.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const files = [
  ["D", "src/data/items/itemsDB_d.ts"],
  ["C", "src/data/items/itemsDB_c.ts"],
  ["B", "src/data/items/itemsDB_b.ts"],
  ["A", "src/data/items/itemsDB_a.ts"],
  ["S", "src/data/items/itemsDB_s.ts"],
];

const armorKinds = new Set(["armor", "helmet", "boots", "gloves", "legs"]);
const jewKinds = new Set(["ring", "earring", "necklace"]);

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

const byGrade = {};
for (const [grade, rel] of files) {
  const ts = fs.readFileSync(path.join(root, rel), "utf8");
  const items = extractEntries(ts);
  const pool = { weapon: [], armor: [], jewelry: [] };
  for (const { id, body } of items) {
    const gM = body.match(/grade:\s*\"([DCBAS])\"/);
    if (!gM || gM[1] !== grade) continue;
    const kM = body.match(/kind:\s*\"([^\"]+)\"/);
    if (!kM) continue;
    const k = kM[1];
    if (k === "weapon") pool.weapon.push(id);
    else if (armorKinds.has(k)) pool.armor.push(id);
    else if (jewKinds.has(k)) pool.jewelry.push(id);
  }
  byGrade[grade] = pool;
  console.error(`${grade}: w=${pool.weapon.length} a=${pool.armor.length} j=${pool.jewelry.length}`);
}
console.log(JSON.stringify(byGrade, null, 2));
