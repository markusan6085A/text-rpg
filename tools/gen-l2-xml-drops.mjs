/**
 * Генерує src/data/world/l2dop/l2XmlDrops.generated.ts з NPC droplist (L2 XML).
 * Джерело: tools/htmlскіли/моби!/20000-20999.xml, 18000-18999.xml
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function range(a, b) {
  const o = [];
  for (let i = a; i <= b; i++) o.push(i);
  return o;
}

const GODDARD_NPC_IDS = [
  ...range(21314, 21323),
  ...range(21324, 21342),
  ...range(21350, 21373),
  ...range(22122, 22129),
];

const NPC_IDS = [
  20001, 20002, 20091, 20545, 20481, 20432, 20544, 20120, 20003, 20004, 20005, 20006, 20007,
  20092, 20093, 20094, 20095, 20096, 20099, 20100, 20021, 20008, 20030, 20035, 20924, 20546,
  20069, 20083, 18001,
  ...GODDARD_NPC_IDS,
];

const MOB_XML_FILES = [
  path.join(root, "tools", "htmlскіли", "моби!", "20000-20999.xml"),
  path.join(root, "tools", "htmlскіли", "моби!", "18000-18999.xml"),
  path.join(root, "tools", "htmlскіли", "моби!", "21000-21999.xml"),
  path.join(root, "tools", "htmlскіли", "моби!", "22000-22999.xml"),
];

const ITEMS_DIR = path.join(root, "tools", "htmlскіли", "ітемс");

const DROPLIST_NUMERIC = {
  57: "adena",
  1864: "stem",
  1865: "varnish",
  1866: "suede",
  1867: "animal_skin",
  1868: "thread",
  1869: "iron_ore",
  1870: "coal",
  1871: "charcoal",
  1872: "animal_bone",
  1873: "silver_nugget",
  1874: "oriharukon_ore",
  1875: "stone_of_purity",
  1876: "mithril_ore",
  1877: "adamantite_nugget",
  1880: "steel",
  1881: "coarse_bone_powder",
  1882: "leather",
  1884: "cord",
  1885: "high_grade_suede",
  1894: "crafted_leather",
  4039: "mold_glue",
  4040: "mold_lubricant",
  4041: "mold_hardener",
  4042: "enria",
  4043: "asofe",
  4044: "thons",
  1831: "soulshot_ng",
  1896: "spiritshot_ng",
};

function loadItemNames() {
  const names = new Map();
  if (!fs.existsSync(ITEMS_DIR)) return names;
  const files = fs.readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".xml"));
  const re = /<item\s+id="(\d+)"[^>]*name="([^"]+)"/g;
  for (const file of files) {
    const txt = fs.readFileSync(path.join(ITEMS_DIR, file), "utf8");
    let m;
    while ((m = re.exec(txt)) !== null) {
      names.set(Number(m[1]), m[2]);
    }
  }
  return names;
}

function parseNpcBlocks(text) {
  const out = new Map();
  const re = /<npc\s+id="(\d+)"[^>]*>([\s\S]*?)<\/npc>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.set(Number(m[1]), m[2]);
  }
  return out;
}

function parseDropsSection(npcBody) {
  const dm = npcBody.match(/<drops>([\s\S]*?)<\/drops>/);
  if (!dm) return { normal: [], spoil: [] };
  const dropsXml = dm[1];
  const normal = [];
  const spoil = [];
  const catRe = /<category\s+id="(-?\d+)">([\s\S]*?)<\/category>/g;
  let cm;
  while ((cm = catRe.exec(dropsXml)) !== null) {
    const catId = Number(cm[1]);
    const body = cm[2];
    const dropRe = /<drop\s+itemid="(\d+)"\s+min="(\d+)"\s+max="(\d+)"\s+chance="(\d+)"/g;
    let d;
    while ((d = dropRe.exec(body)) !== null) {
      const row = {
        itemid: Number(d[1]),
        min: Number(d[2]),
        max: Number(d[3]),
        chance: Number(d[4]),
      };
      if (catId === -1) spoil.push({ ...row, category: catId });
      else normal.push({ ...row, category: catId });
    }
  }
  return { normal, spoil };
}

function toDropEntry(row, itemNames, isSpoil) {
  const { itemid, min, max, chance, category } = row;
  const cpm = chance;
  const chanceFloat = cpm / 1_000_000;

  if (itemid === 57) {
    return {
      id: "adena",
      kind: "adena",
      chance: chanceFloat,
      min,
      max,
      chancePerMillion: cpm,
      l2ItemId: 57,
      displayName: "Adena",
    };
  }

  const mapped = DROPLIST_NUMERIC[itemid];
  if (mapped) {
    return {
      id: mapped,
      kind: "resource",
      chance: chanceFloat,
      min,
      max,
      chancePerMillion: cpm,
      l2ItemId: itemid,
      displayName: itemNames.get(itemid),
    };
  }

  const nm = itemNames.get(itemid);
  const kind = category === 1 ? "equipment" : "resource";
  return {
    id: `l2item_${itemid}`,
    kind,
    chance: chanceFloat,
    min,
    max,
    chancePerMillion: cpm,
    l2ItemId: itemid,
    displayName: nm || `Item ${itemid}`,
  };
}

function main() {
  const itemNames = loadItemNames();
  let allNpcs = new Map();
  for (const f of MOB_XML_FILES) {
    if (!fs.existsSync(f)) {
      console.warn("skip missing", f);
      continue;
    }
    const text = fs.readFileSync(f, "utf8");
    for (const [id, body] of parseNpcBlocks(text)) {
      allNpcs.set(id, body);
    }
  }

  const byNpc = {};
  for (const npcId of NPC_IDS) {
    const body = allNpcs.get(npcId);
    if (!body) {
      console.warn("NPC not found in XML:", npcId);
      continue;
    }
    const { normal, spoil } = parseDropsSection(body);
    byNpc[npcId] = {
      drops: normal.map((r) => toDropEntry(r, itemNames, false)),
      spoil: spoil.map((r) => toDropEntry(r, itemNames, true)),
    };
  }

  const outPath = path.join(root, "src", "data", "world", "l2dop", "l2XmlDrops.generated.ts");
  const header = `// AUTO-GENERATED by tools/gen-l2-xml-drops.mjs — do not edit by hand.
import type { DropEntry } from "../../combat/types";

export type L2XmlNpcDrops = { drops: DropEntry[]; spoil: DropEntry[] };

export const L2_XML_DROPS_BY_NPC: Record<number, L2XmlNpcDrops> = `;

  const json = JSON.stringify(byNpc, null, 2);
  const tsObj = json
    .replace(/"id":/g, "id:")
    .replace(/"kind":/g, "kind:")
    .replace(/"chance":/g, "chance:")
    .replace(/"min":/g, "min:")
    .replace(/"max":/g, "max:")
    .replace(/"chancePerMillion":/g, "chancePerMillion:")
    .replace(/"l2ItemId":/g, "l2ItemId:")
    .replace(/"displayName":/g, "displayName:")
    .replace(/"drops":/g, "drops:")
    .replace(/"spoil":/g, "spoil:")
    .replace(/"adena"/g, '"adena"')
    .replace(/"resource"/g, '"resource"')
    .replace(/"equipment"/g, '"equipment"');

  fs.writeFileSync(outPath, `${header}${tsObj} as const satisfies Record<number, L2XmlNpcDrops>;\n`, "utf8");
  console.log("Wrote", outNpcCount(byNpc), "npcs to", outPath);
}

function outNpcCount(o) {
  return Object.keys(o).length;
}

main();
